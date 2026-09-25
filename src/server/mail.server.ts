import nodemailer from "nodemailer";

import { siteConfig } from "@/lib/site-data";
import type { OrderStatus } from "@/server/orders";

function smtpConfigured() {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

function getTransporter() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: (process.env.SMTP_SECURE ?? "true") !== "false",
    auth: { user, pass },
  });
}

const statusCopy: Record<
  OrderStatus,
  { subject: string; headline: string; body: string }
> = {
  new: {
    subject: "We received your order",
    headline: "Order received",
    body: "Thanks for your order. We’ve received it and will start preparing it shortly.",
  },
  processing: {
    subject: "Your order is being packed",
    headline: "Packing in progress",
    body: "Good news — your order is now being packed at the studio.",
  },
  shipped: {
    subject: "Your order is on the way",
    headline: "Shipped",
    body: "Your order has been shipped and is on its way to you.",
  },
  delivered: {
    subject: "Your order was delivered",
    headline: "Delivered",
    body: "Your order has been marked as delivered. We hope you love it.",
  },
  cancelled: {
    subject: "Your order was cancelled",
    headline: "Cancelled",
    body: "Your order has been cancelled. If this is unexpected, reply to this email and we’ll help.",
  },
};

export async function sendOrderStatusEmail(input: {
  to: string;
  customerName: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
}) {
  if (!smtpConfigured()) {
    console.warn(
      "[mail] SMTP_USER / SMTP_PASS not set — skipped order status email.",
    );
    return { sent: false as const, reason: "not_configured" as const };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const brand = process.env.SMTP_FROM_NAME?.trim() || siteConfig.brandName;
  const fromAddress =
    process.env.SMTP_FROM?.trim() || process.env.SMTP_USER!.trim();
  const copy = statusCopy[input.status];
  const totalLabel = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(input.total);

  const html = `
    <div style="font-family: Georgia, serif; color: #2b1a1f; line-height: 1.5;">
      <p style="font-size: 18px; color: #7a1f3d;">${brand}</p>
      <h1 style="font-size: 22px; margin: 0 0 12px;">${copy.headline}</h1>
      <p>Hi ${escapeHtml(input.customerName)},</p>
      <p>${copy.body}</p>
      <p>
        <strong>Order:</strong> #${escapeHtml(input.orderNumber)}<br />
        <strong>Status:</strong> ${escapeHtml(input.status)}<br />
        <strong>Total:</strong> ${totalLabel}
      </p>
      <p style="color: #6b5a60; font-size: 13px;">
        You’re receiving this because you placed an order with ${brand}.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${brand}" <${fromAddress}>`,
    to: input.to,
    subject: `${copy.subject} (#${input.orderNumber})`,
    text: [
      `Hi ${input.customerName},`,
      "",
      copy.body,
      "",
      `Order: #${input.orderNumber}`,
      `Status: ${input.status}`,
      `Total: ${totalLabel}`,
    ].join("\n"),
    html,
  });

  return { sent: true as const };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
