import { loadRazorpayCheckout } from "@/lib/razorpay-checkout";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "@/server/razorpay";
import { siteConfig } from "@/lib/site-data";

export interface RazorpayCheckoutInput {
  amount: number;
  receipt: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  onSuccess?: (payment: {
    orderId: string;
    paymentId: string;
  }) => void | Promise<void>;
}

type CreatedOrder = {
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
};

export async function openRazorpayCheckout(input: RazorpayCheckoutInput) {
  const loaded = await loadRazorpayCheckout();
  if (!loaded) {
    throw new Error("Could not load Razorpay checkout. Please try again.");
  }

  let order: CreatedOrder;
  try {
    order = (await createRazorpayOrder({
      data: { amount: input.amount, receipt: input.receipt },
    })) as CreatedOrder;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Could not create Razorpay order.");
  }

  if (!order?.orderId || !order.amount) {
    throw new Error(
      "Payment order was not created. Restart the app so Razorpay env keys load.",
    );
  }

  const publicKey = (
    order.keyId?.trim() ||
    import.meta.env.VITE_RAZORPAY_KEY_ID?.trim() ||
    ""
  ).trim();

  if (!publicKey) {
    throw new Error(
      "Razorpay key is missing. Set VITE_RAZORPAY_KEY_ID in .env and restart.",
    );
  }

  return new Promise<void>((resolve, reject) => {
    const razorpay = new window.Razorpay({
      key: publicKey,
      amount: order.amount,
      currency: order.currency || "INR",
      name: siteConfig.name,
      description: `${siteConfig.brandName} order`,
      order_id: order.orderId,
      prefill: {
        name: input.customer.name,
        contact: input.customer.phone,
        email: input.customer.email,
      },
      theme: { color: "#d65588" },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled.")),
      },
      handler: async (response) => {
        try {
          if (
            !response.razorpay_order_id ||
            !response.razorpay_payment_id ||
            !response.razorpay_signature
          ) {
            throw new Error("Payment response was incomplete.");
          }

          await verifyRazorpayPayment({
            data: {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            },
          });
          await input.onSuccess?.({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
          });
          resolve();
        } catch (error) {
          reject(
            error instanceof Error
              ? error
              : new Error("Payment verification failed."),
          );
        }
      },
    });

    razorpay.on("payment.failed", (event) => {
      reject(new Error(event.error.description ?? "Payment failed."));
    });

    razorpay.open();
  });
}
