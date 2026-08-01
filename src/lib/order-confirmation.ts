import type { DeliveryMethod } from "@/lib/order-totals";

export interface ConfirmedOrderItem {
  name: string;
  subtitle: string;
  image: string;
  quantity: number;
  linePrice: number;
}

export interface ConfirmedOrder {
  orderNumber: string;
  deliveryMethod: DeliveryMethod;
  deliveryLabel: string;
  estimatedDelivery: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  items: ConfirmedOrderItem[];
}

const STORAGE_KEY = "vk_last_order";

export function generateOrderNumber() {
  const suffix = Math.floor(10000 + Math.random() * 90000);
  return `LB-${suffix}`;
}

function addBusinessDays(start: Date, businessDays: number) {
  const result = new Date(start);
  let added = 0;
  while (added < businessDays) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return result;
}

function formatDeliveryDate(date: Date) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  return `Arriving by ${weekday}, ${month} ${day}${getOrdinalSuffix(day)}`;
}

function getOrdinalSuffix(day: number) {
  if (day >= 11 && day <= 13) return "th";
  const last = day % 10;
  if (last === 1) return "st";
  if (last === 2) return "nd";
  if (last === 3) return "rd";
  return "th";
}

export function getEstimatedDelivery(delivery: DeliveryMethod) {
  const businessDays = delivery === "express" ? 2 : 7;
  const arrival = addBusinessDays(new Date(), businessDays);
  return formatDeliveryDate(arrival);
}

export function getDeliveryLabel(delivery: DeliveryMethod) {
  if (delivery === "express") return "Express Shipping";
  return "Standard Insured Shipping";
}

export function saveConfirmedOrder(order: ConfirmedOrder) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

export function loadConfirmedOrder(): ConfirmedOrder | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ConfirmedOrder;
  } catch {
    return null;
  }
}

export function formatIntention(subtitle: string) {
  if (subtitle.toLowerCase().startsWith("intention:")) return subtitle;
  if (subtitle.toLowerCase().startsWith("customized:")) {
    return `Intention: ${subtitle.replace(/^customized:\s*/i, "")}`;
  }
  return `Intention: ${subtitle}`;
}
