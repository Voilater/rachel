import { createServerFn } from "@tanstack/react-start";

import type { PaymentReceiptOcrResult } from "@/lib/payment-receipt-ocr";
import type { CreateOrderInput } from "@/server/orders";

export const createUpiPayment = createServerFn({ method: "POST" })
  .validator((data: CreateOrderInput) => data)
  .handler(async ({ data }) => {
    const { createUpiPaymentImpl } = await import("@/server/payment.server");
    return createUpiPaymentImpl(data);
  });

export const reportUpiPayment = createServerFn({ method: "POST" })
  .validator(
    (data: { paymentReference: string; receipt: PaymentReceiptOcrResult }) =>
      data,
  )
  .handler(async ({ data }) => {
    const { reportUpiPaymentImpl } = await import("@/server/payment.server");
    return reportUpiPaymentImpl(data);
  });

export const getUpiPaymentReport = createServerFn({ method: "POST" })
  .validator((data: { orderId: string }) => data)
  .handler(async ({ data }) => {
    const { getUpiPaymentReportImpl } = await import("@/server/payment.server");
    return getUpiPaymentReportImpl(data);
  });
