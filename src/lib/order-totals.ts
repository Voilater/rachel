export const TAX_RATE = 0.08;

export const EXPRESS_SHIPPING_FEE = 15;

export type DeliveryMethod = "standard" | "express";

export const deliveryOptions: {
  id: DeliveryMethod;
  label: string;
  price: number;
  eta: string;
  note: string;
}[] = [
  {
    id: "standard",
    label: "Standard",
    price: 0,
    eta: "5–7 Business Days",
    note: "Includes eco-friendly packaging.",
  },
  {
    id: "express",
    label: "Express",
    price: EXPRESS_SHIPPING_FEE,
    eta: "1–2 Business Days",
    note: "Priority artisan fulfillment.",
  },
];

export interface CartLineInput {
  linePrice: number;
  quantity: number;
}

export function computeOrderTotals(
  items: CartLineInput[],
  delivery: DeliveryMethod = "standard",
) {
  const subtotal = items.reduce((sum, i) => sum + i.linePrice * i.quantity, 0);
  const shipping =
    delivery === "express" ? EXPRESS_SHIPPING_FEE : subtotal > 0 ? 0 : 0;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  return { subtotal, shipping, tax, total };
}

export function toPaise(amount: number) {
  return Math.round(amount * 100);
}
