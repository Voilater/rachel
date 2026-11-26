export const TAX_RATE = 0.08;

export const PROCESSING_FEE = 40;

export const DEFAULT_PRODUCT_WEIGHT_GRAMS = 100;
export const MAX_PRODUCT_WEIGHT_GRAMS = 1_000_000;

export type CourierMethod = "st-courier" | "professional-courier" | "india-post";
export type LegacyDeliveryMethod = "standard" | "express";
export type DeliveryMethod = CourierMethod | LegacyDeliveryMethod;

export const deliveryOptions: {
  id: CourierMethod;
  label: string;
  pricePerKg: number;
  eta: string;
  note: string;
}[] = [
  {
    id: "st-courier",
    label: "ST Courier",
    pricePerKg: 80,
    eta: "3–5 Business Days",
    note: "₹80 per billed kg.",
  },
  {
    id: "professional-courier",
    label: "Professional Courier",
    pricePerKg: 90,
    eta: "3–5 Business Days",
    note: "₹90 per billed kg.",
  },
  {
    id: "india-post",
    label: "India Post",
    pricePerKg: 100,
    eta: "5–7 Business Days",
    note: "₹100 per billed kg.",
  },
];

export interface CartLineInput {
  linePrice: number;
  quantity: number;
  weightGrams?: number;
}

export function computeOrderTotals(
  items: CartLineInput[],
  delivery: DeliveryMethod = "standard",
) {
  const subtotal = items.reduce((sum, i) => sum + i.linePrice * i.quantity, 0);
  const shipmentWeightGrams = items.reduce(
    (sum, item) =>
      sum +
      (item.weightGrams ?? DEFAULT_PRODUCT_WEIGHT_GRAMS) * item.quantity,
    0,
  );
  const billableWeightKg =
    shipmentWeightGrams > 0 ? Math.ceil(shipmentWeightGrams / 1000) : 0;
  const option = deliveryOptions.find((item) => item.id === delivery);
  const shipping = option
    ? option.pricePerKg * billableWeightKg
    : delivery === "express"
      ? 15
      : 0;
  const processingFee = option && subtotal > 0 ? PROCESSING_FEE : 0;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + processingFee + tax;

  return {
    subtotal,
    shipping,
    processingFee,
    shipmentWeightGrams,
    billableWeightKg,
    tax,
    total,
  };
}

export function formatWeightGrams(weightGrams: number) {
  if (weightGrams < 1000) return `${weightGrams} g`;
  const kilograms = Number((weightGrams / 1000).toFixed(3));
  return `${kilograms} kg`;
}

export function toPaise(amount: number) {
  return Math.round(amount * 100);
}
