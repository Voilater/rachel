import { createHmac, timingSafeEqual } from "node:crypto";

import { createServerFn } from "@tanstack/react-start";

import { toPaise } from "@/lib/order-totals";

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    const err = new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
    (err as Error & { status?: number }).status = 401;
    throw err;
  }

  return { keyId, keySecret };
}

function assertNonEmpty(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    const err = new Error(`Missing required field: ${field}`);
    (err as Error & { status?: number }).status = 400;
    throw err;
  }
  return value.trim();
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .validator((data: { amount: number; receipt: string }) => data)
  .handler(async ({ data }) => {
    const amount = toPaise(data.amount);
    const receipt = assertNonEmpty(data.receipt, "receipt").slice(0, 40);

    if (!Number.isFinite(amount) || amount < 100) {
      const err = new Error("Order amount must be at least ₹1 (100 paise).");
      (err as Error & { status?: number }).status = 400;
      throw err;
    }

    const { keyId, keySecret } = getRazorpayCredentials();

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[razorpay] create order failed:", response.status, errorBody);
      const err = new Error(
        response.status === 401
          ? "Razorpay authentication failed. Check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET."
          : `Failed to create Razorpay order (${response.status}).`,
      );
      (err as Error & { status?: number }).status =
        response.status === 401 ? 401 : 500;
      throw err;
    }

    const order = (await response.json()) as {
      id: string;
      amount: number | string;
      currency: string;
    };

    if (!order?.id) {
      throw new Error("Razorpay did not return an order id.");
    }

    const orderAmount = Number(order.amount);

    try {
      const { writeAuditLog } = await import("@/server/audit-log.server");
      await writeAuditLog({
        action: "payment.razorpay.create",
        status: "success",
        message: `Razorpay order ${order.id}`,
        metadata: {
          razorpayOrderId: order.id,
          amount: orderAmount,
          currency: order.currency,
          receipt,
        },
      });
    } catch {
      // Don't block checkout if audit logging fails.
    }

    return {
      orderId: order.id,
      amount: orderAmount,
      currency: order.currency || "INR",
      keyId,
    };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .validator(
    (data: { orderId: string; paymentId: string; signature: string }) => data,
  )
  .handler(async ({ data }) => {
    const orderId = assertNonEmpty(data.orderId, "orderId");
    const paymentId = assertNonEmpty(data.paymentId, "paymentId");
    const signature = assertNonEmpty(data.signature, "signature");
    const { keySecret } = getRazorpayCredentials();

    const expected = createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const expectedBuf = Buffer.from(expected, "utf8");
    const signatureBuf = Buffer.from(signature, "utf8");
    const matched =
      expectedBuf.length === signatureBuf.length &&
      timingSafeEqual(expectedBuf, signatureBuf);

    try {
      const { writeAuditLog } = await import("@/server/audit-log.server");
      await writeAuditLog({
        action: "payment.razorpay.verify",
        status: matched ? "success" : "failure",
        message: matched ? "Payment verified" : "Payment signature mismatch",
        metadata: {
          razorpayOrderId: orderId,
          paymentId,
        },
      });
    } catch {
      // Don't block verify response if audit logging fails.
    }

    if (!matched) {
      const err = new Error("Payment verification failed: signature mismatch.");
      (err as Error & { status?: number }).status = 400;
      throw err;
    }

    return { verified: true, orderId, paymentId };
  });
