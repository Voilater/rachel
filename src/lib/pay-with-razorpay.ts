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
  onSuccess?: () => void | Promise<void>;
}

export async function openRazorpayCheckout(input: RazorpayCheckoutInput) {
  const loaded = await loadRazorpayCheckout();
  if (!loaded) {
    throw new Error("Could not load Razorpay checkout. Please try again.");
  }

  const order = await createRazorpayOrder({
    data: { amount: input.amount, receipt: input.receipt },
  });

  return new Promise<void>((resolve, reject) => {
    const razorpay = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
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
          await verifyRazorpayPayment({
            data: {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            },
          });
          await input.onSuccess?.();
          resolve();
        } catch (error) {
          reject(error instanceof Error ? error : new Error("Payment verification failed."));
        }
      },
    });

    razorpay.on("payment.failed", (event) => {
      reject(new Error(event.error.description ?? "Payment failed."));
    });

    razorpay.open();
  });
}
