import { randomUUID } from "node:crypto";

import type { ConfirmedOrder } from "@/lib/order-confirmation";
import {
  INDIAN_MOBILE_ERROR,
  isValidEmail,
  normalizeEmail,
  normalizeIndianMobileNumber,
} from "@/lib/form-validation";
import { isTestOnlyProduct } from "@/lib/shop-filters";
import type { PaymentReceiptOcrResult } from "@/lib/payment-receipt-ocr";
import {
  computeOrderTotals,
  deliveryOptions,
} from "@/lib/order-totals";
import type { CreateOrderInput } from "@/server/orders";
import { requireAdminSession } from "@/server/admin-session.server";
import {
  createOrderImpl,
  getOrderByNumberImpl,
} from "@/server/orders.server";
import { execute, query, queryOne } from "@/server/db";
import { resolveSessionUser } from "@/server/session-resolve";

const DEFAULT_UPI_VPA = "saranyaracheljn@oksbi";
const DEFAULT_UPI_PAYEE_NAME = "rachelparadise";

interface PaymentIntentRow {
  payment_id: string;
  order_number: string;
  amount: number;
  currency: string;
  order_payload: CreateOrderInput | string;
  completed_order_id: string | null;
}

interface PaymentReportRow {
  report_data: PaymentReceiptOcrResult | string | null;
}

interface CheckoutProductRow {
  id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  badge: string | null;
  weight_grams: number;
}

function assertOrderInput(data: CreateOrderInput) {
  if (!data || typeof data !== "object")
    throw new Error("Invalid checkout details.");
  if (typeof data.orderNumber !== "string" || !data.orderNumber.trim()) {
    throw new Error("Order number is required.");
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("Cannot create a payment for an empty order.");
  }
  if (
    typeof data.customer?.name !== "string" ||
    !data.customer.name.trim() ||
    typeof data.customer.email !== "string" ||
    !data.customer.email.trim()
  ) {
    throw new Error("Customer name and email are required for payment.");
  }
  if (!isValidEmail(data.customer.email)) {
    throw new Error("Enter a valid email address.");
  }
  if (
    typeof data.customer.phone !== "string" ||
    !normalizeIndianMobileNumber(data.customer.phone)
  ) {
    throw new Error(INDIAN_MOBILE_ERROR);
  }
  if (
    typeof data.shippingAddress?.street !== "string" ||
    !data.shippingAddress.street.trim() ||
    typeof data.shippingAddress.city !== "string" ||
    !data.shippingAddress.city.trim() ||
    typeof data.shippingAddress.zip !== "string" ||
    !data.shippingAddress.zip.trim()
  ) {
    throw new Error("A complete shipping address is required.");
  }
  if (
    data.deliveryMethod !== "standard" &&
    data.deliveryMethod !== "express" &&
    !deliveryOptions.some((option) => option.id === data.deliveryMethod)
  ) {
    throw new Error("Delivery method is invalid.");
  }

  const money = [data.subtotal, data.shipping, data.tax, data.total];
  if (money.some((amount) => !Number.isFinite(amount) || amount < 0)) {
    throw new Error("Checkout totals are invalid.");
  }
  const expected = computeOrderTotals(
    data.items.map(({ linePrice, quantity, weightGrams }) => ({
      linePrice,
      quantity,
      weightGrams,
    })),
    data.deliveryMethod,
  );
  const round = (amount: number) => Math.round(amount * 100);
  const usesCourierRates = deliveryOptions.some(
    (option) => option.id === data.deliveryMethod,
  );
  if (
    round(expected.subtotal) !== round(data.subtotal) ||
    round(expected.shipping) !== round(data.shipping) ||
    round(expected.processingFee) !==
      round(data.processingFee ?? (usesCourierRates ? Number.NaN : 0)) ||
    (usesCourierRates &&
      expected.shipmentWeightGrams !== data.shipmentWeightGrams) ||
    round(expected.tax) !== round(data.tax) ||
    round(expected.total) !== round(data.total)
  ) {
    throw new Error("Checkout totals do not match the order items.");
  }
  if (round(data.total) < 100) {
    throw new Error("Order amount must be at least ₹1.");
  }
}

async function prepareOrderInput(
  data: CreateOrderInput,
): Promise<CreateOrderInput> {
  assertOrderInput(data);
  if (
    !deliveryOptions.some((option) => option.id === data.deliveryMethod)
  ) {
    throw new Error("Choose one of the available courier services.");
  }
  const session = await resolveSessionUser();
  if (!session) throw new Error("Sign in again before starting payment.");
  if (
    (data.customer.userId && data.customer.userId !== session.id) ||
    data.customer.email.trim().toLowerCase() !==
      session.email.trim().toLowerCase()
  ) {
    throw new Error("The signed-in customer does not match this checkout.");
  }
  const phone = normalizeIndianMobileNumber(data.customer.phone);
  if (!phone) throw new Error(INDIAN_MOBILE_ERROR);

  const productIds = [...new Set(data.items.map((item) => item.productId))];
  if (productIds.some((id) => typeof id !== "string" || !id.trim())) {
    throw new Error("Every checkout item must reference a product.");
  }
  const placeholders = productIds.map(() => "?").join(", ");
  const products = await query<CheckoutProductRow>(
    `SELECT id, name, image, price, stock, badge, weight_grams
     FROM products WHERE id IN (${placeholders})`,
    productIds,
  );
  const productById = new Map(products.map((product) => [product.id, product]));
  const quantities = new Map<string, number>();
  const items = data.items.map((item) => {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      throw new Error("Product quantity is invalid.");
    }
    const product = productById.get(item.productId ?? "");
    if (!product || isTestOnlyProduct(product)) {
      throw new Error("A product in this checkout is no longer available.");
    }

    const unitPrice = Number(product.price);
    if (Math.round(item.linePrice * 100) !== Math.round(unitPrice * 100)) {
      throw new Error(
        "A product price changed. Please review your cart and try again.",
      );
    }
    quantities.set(
      product.id,
      (quantities.get(product.id) ?? 0) + item.quantity,
    );
    return {
      ...item,
      name: product.name,
      image: product.image,
      linePrice: unitPrice,
      weightGrams: Number(product.weight_grams),
    };
  });

  for (const [productId, quantity] of quantities) {
    const product = productById.get(productId);
    if (!product || quantity > product.stock) {
      throw new Error("A product in this checkout no longer has enough stock.");
    }
  }

  const totals = computeOrderTotals(
    items.map(({ linePrice, quantity, weightGrams }) => ({
      linePrice,
      quantity,
      weightGrams,
    })),
    data.deliveryMethod,
  );
  const round = (amount: number) => Math.round(amount * 100);
  if (
    round(totals.subtotal) !== round(data.subtotal) ||
    round(totals.shipping) !== round(data.shipping) ||
    round(totals.processingFee) !== round(data.processingFee ?? Number.NaN) ||
    totals.shipmentWeightGrams !== data.shipmentWeightGrams ||
    round(totals.tax) !== round(data.tax) ||
    round(totals.total) !== round(data.total)
  ) {
    throw new Error(
      "The checkout total changed. Please review your cart and try again.",
    );
  }

  return {
    ...data,
    customer: {
      ...data.customer,
      userId: session.id,
      email: normalizeEmail(session.email),
      phone,
      isGuest: false,
    },
    items,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    processingFee: totals.processingFee,
    shipmentWeightGrams: totals.shipmentWeightGrams,
    tax: totals.tax,
    total: totals.total,
  };
}

function parseOrderPayload(payload: PaymentIntentRow["order_payload"]) {
  const data = typeof payload === "string" ? JSON.parse(payload) : payload;
  assertOrderInput(data);
  return data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cleanOcrText(value: unknown, field: string): string | null {
  if (value == null) return null;
  if (typeof value !== "string" || value.length > 255) {
    throw new Error(`OCR ${field} is invalid.`);
  }
  return value.trim() || null;
}

function normalizeOcrResult(value: unknown): PaymentReceiptOcrResult {
  if (!isRecord(value)) throw new Error("OCR payment details are invalid.");
  const amount = value.amount;
  const confidence = value.confidence;
  if (
    amount !== null &&
    (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0)
  ) {
    throw new Error("OCR payment amount is invalid.");
  }
  if (
    confidence !== null &&
    (typeof confidence !== "number" ||
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 100)
  ) {
    throw new Error("OCR confidence is invalid.");
  }
  return {
    amount: typeof amount === "number" ? amount : null,
    transactionReference: cleanOcrText(
      value.transactionReference,
      "transaction reference",
    ),
    orderReference: cleanOcrText(value.orderReference, "order reference"),
    paymentStatus: cleanOcrText(value.paymentStatus, "payment status"),
    paidAt: cleanOcrText(value.paidAt, "payment date"),
    payeeName: cleanOcrText(value.payeeName, "payee name"),
    payeeUpiId: cleanOcrText(value.payeeUpiId, "payee UPI ID"),
    payerName: cleanOcrText(value.payerName, "payer name"),
    payerBank: cleanOcrText(value.payerBank, "payer bank"),
    payerBankAccount: cleanOcrText(
      value.payerBankAccount,
      "payer bank account",
    ),
    payerUpiId: cleanOcrText(value.payerUpiId, "payer UPI ID"),
    confidence: typeof confidence === "number" ? confidence : null,
  };
}

function toConfirmedOrder(
  order: Awaited<ReturnType<typeof createOrderImpl>>,
): ConfirmedOrder {
  return {
    orderNumber: order.orderNumber,
    deliveryMethod: order.deliveryMethod,
    deliveryLabel: order.deliveryLabel,
    estimatedDelivery: order.estimatedDelivery,
    subtotal: order.subtotal,
    shipping: order.shipping,
    processingFee: order.processingFee,
    shipmentWeightGrams: order.shipmentWeightGrams,
    tax: order.tax,
    total: order.total,
    items: order.items,
    paymentStatus: order.payment?.status,
  };
}

export async function createUpiPaymentImpl(data: CreateOrderInput) {
  const order = await prepareOrderInput(data);
  const upiId = process.env.UPI_VPA?.trim() || DEFAULT_UPI_VPA;
  const payeeName =
    process.env.UPI_PAYEE_NAME?.trim() || DEFAULT_UPI_PAYEE_NAME;
  if (
    !/^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}$/.test(upiId) ||
    payeeName.length > 100
  ) {
    throw new Error("UPI_VPA or UPI_PAYEE_NAME is invalid.");
  }

  const amount = order.total.toFixed(2);
  const paymentReference = `upi_${randomUUID().replaceAll("-", "")}`;
  const qrParams = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    tr: paymentReference,
    tn: `Order-${order.orderNumber}`,
    am: amount,
    cu: "INR",
  });
  const upiUri = `upi://pay?${qrParams.toString()}`;

  await execute(
    `INSERT INTO payment_intents
      (payment_id, order_number, amount, currency, order_payload)
     VALUES (?, ?, ?, 'INR', ?)`,
    [paymentReference, order.orderNumber, amount, JSON.stringify(order)],
  );

  return {
    paymentReference,
    orderNumber: order.orderNumber,
    upiUri,
    amount,
    upiId,
    payeeName,
  };
}

export async function reportUpiPaymentImpl(data: {
  paymentReference: string;
  receipt: PaymentReceiptOcrResult;
}): Promise<ConfirmedOrder> {
  const paymentReference = data.paymentReference.trim();
  const receipt = normalizeOcrResult(data.receipt);
  const transactionReference = receipt.transactionReference ?? "";
  const paymentStatus = receipt.paymentStatus?.toLowerCase();
  if (!/^upi_[a-f0-9]{32}$/i.test(paymentReference)) {
    throw new Error("Payment reference is invalid.");
  }
  if (!/^[A-Za-z0-9-]{6,40}$/.test(transactionReference)) {
    throw new Error("Enter a valid UPI transaction reference / UTR.");
  }
  const intent = await queryOne<PaymentIntentRow>(
    "SELECT * FROM payment_intents WHERE payment_id = ?",
    [paymentReference],
  );
  if (!intent)
    throw new Error(
      "Payment request was not found. Please try checkout again.",
    );
  if (
    receipt.amount === null ||
    Math.round(receipt.amount * 100) !== Math.round(Number(intent.amount) * 100)
  ) {
    throw new Error(
      "The amount read from the screenshot does not match this order.",
    );
  }
  if (
    !receipt.orderReference ||
    receipt.orderReference.toLowerCase() !== intent.order_number.toLowerCase()
  ) {
    throw new Error(
      "The order reference read from the screenshot does not match this order.",
    );
  }
  if (
    !paymentStatus ||
    !["completed", "successful", "succeeded"].includes(paymentStatus)
  ) {
    throw new Error(
      "The screenshot does not show a completed payment. Upload the successful receipt.",
    );
  }

  const orderData = parseOrderPayload(intent.order_payload);
  const session = await resolveSessionUser();
  if (
    !session ||
    session.id !== orderData.customer.userId ||
    session.email.trim().toLowerCase() !==
      orderData.customer.email.trim().toLowerCase()
  ) {
    throw new Error(
      "Sign in to the account used for this checkout to view the order.",
    );
  }

  if (intent.completed_order_id) {
    const completedOrder = await getOrderByNumberImpl(intent.order_number);
    if (
      completedOrder?.id === intent.completed_order_id &&
      completedOrder.payment?.provider === "UPI QR" &&
      completedOrder.payment.status === "pending" &&
      completedOrder.payment.transactionReference === transactionReference
    ) {
      await execute(
        `UPDATE payment_intents
         SET report_data = ?
         WHERE payment_id = ? AND completed_order_id = ?`,
        [JSON.stringify(receipt), paymentReference, completedOrder.id],
      );
      return toConfirmedOrder(completedOrder);
    }
    throw new Error("This UPI payment report has already been submitted.");
  }

  const previousUse = await queryOne<{ id: string }>(
    `SELECT id FROM orders
     WHERE payment_provider = 'UPI QR' AND payment_transaction_reference = ?`,
    [transactionReference],
  );
  if (previousUse) {
    throw new Error(
      "This UPI transaction reference has already been submitted.",
    );
  }

  let createdOrder: Awaited<ReturnType<typeof createOrderImpl>>;
  try {
    createdOrder = await createOrderImpl({
      ...orderData,
      payment: {
        provider: "UPI QR",
        paymentId: paymentReference,
        transactionReference,
        status: "pending",
      },
    });
  } catch (error) {
    const existingOrder = await getOrderByNumberImpl(intent.order_number);
    if (
      !existingOrder ||
      existingOrder.payment?.provider !== "UPI QR" ||
      existingOrder.payment.status !== "pending" ||
      existingOrder.payment.transactionReference !== transactionReference
    ) {
      throw error;
    }
    createdOrder = existingOrder;
  }
  await execute(
    `UPDATE payment_intents
     SET completed_order_id = ?, report_data = ?
     WHERE payment_id = ?`,
    [createdOrder.id, JSON.stringify(receipt), paymentReference],
  );

  try {
    const { sendUpiPaymentReportEmail } = await import("@/server/mail.server");
    await sendUpiPaymentReportEmail({
      orderNumber: createdOrder.orderNumber,
      customerName: createdOrder.customer.name,
      amount: createdOrder.total,
      paymentReference,
      transactionReference,
    });
  } catch (error) {
    console.error(
      "[mail] Failed to send UPI payment report notification:",
      error,
    );
  }

  return toConfirmedOrder(createdOrder);
}

export async function getUpiPaymentReportImpl(data: {
  orderId: string;
}): Promise<PaymentReceiptOcrResult | null> {
  await requireAdminSession();
  if (typeof data.orderId !== "string" || !data.orderId.trim()) {
    throw new Error("Order ID is required.");
  }
  const row = await queryOne<PaymentReportRow>(
    `SELECT payment_intents.report_data
     FROM payment_intents
     JOIN orders ON orders.id = payment_intents.completed_order_id
     WHERE orders.id = ? AND orders.payment_provider = 'UPI QR'`,
    [data.orderId],
  );
  if (!row?.report_data) return null;
  const report =
    typeof row.report_data === "string"
      ? JSON.parse(row.report_data)
      : row.report_data;
  return normalizeOcrResult(report);
}
