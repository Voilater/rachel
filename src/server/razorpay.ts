import { createHmac } from "node:crypto";

import { createServerFn } from "@tanstack/react-start";

import { toPaise } from "@/lib/order-totals";

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }

  return { keyId, keySecret };
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .validator((data: { amount: number; receipt: string }) => data)
  .handler(async ({ data }) => {
    const { keyId, keySecret } = getRazorpayCredentials();
    const amount = toPaise(data.amount);

    if (amount < 100) {
      throw new Error("Order amount must be at least ₹1.");
    }

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: data.receipt,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to create Razorpay order: ${errorBody}`);
    }

    const order = (await response.json()) as { id: string; amount: number; currency: string };

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .validator(
    (data: { orderId: string; paymentId: string; signature: string }) => data,
  )
  .handler(async ({ data }) => {
    const { keySecret } = getRazorpayCredentials();

    const expected = createHmac("sha256", keySecret)
      .update(`${data.orderId}|${data.paymentId}`)
      .digest("hex");

    if (expected !== data.signature) {
      throw new Error("Payment verification failed.");
    }

    return { verified: true };
  });
