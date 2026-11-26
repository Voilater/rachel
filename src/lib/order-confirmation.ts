import type { DeliveryMethod } from "@/lib/order-totals";
import { migrateStorageKeys } from "@/lib/storage-migration";

export interface ConfirmedOrderItem {
  name: string;
  subtitle: string;
  image: string;
  quantity: number;
  linePrice: number;
  weightGrams?: number;
}

export interface ConfirmedOrder {
  orderNumber: string;
  deliveryMethod: DeliveryMethod;
  deliveryLabel: string;
  estimatedDelivery: string;
  subtotal: number;
  shipping: number;
  processingFee?: number;
  shipmentWeightGrams?: number;
  tax: number;
  total: number;
  items: ConfirmedOrderItem[];
  paymentStatus?: "pending" | "paid" | "rejected";
}

const STORAGE_KEY = "rachelparadise_last_order";

function migrateOrderStorage() {
  if (typeof sessionStorage === "undefined") return;
  migrateStorageKeys(sessionStorage, [["vk_last_order", STORAGE_KEY]]);
}

export function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `LB-${timestamp}-${suffix}`;
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
  const businessDays =
    delivery === "express"
      ? 2
      : delivery === "st-courier" || delivery === "professional-courier"
        ? 5
        : 7;
  const arrival = addBusinessDays(new Date(), businessDays);
  return formatDeliveryDate(arrival);
}

export function getDeliveryLabel(delivery: DeliveryMethod) {
  switch (delivery) {
    case "st-courier":
      return "ST Courier";
    case "professional-courier":
      return "Professional Courier";
    case "india-post":
      return "India Post";
    case "express":
      return "Express Shipping";
    default:
      return "Standard Insured Shipping";
  }
}

export function saveConfirmedOrder(order: ConfirmedOrder) {
  if (typeof sessionStorage === "undefined") return;
  migrateOrderStorage();
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

export function loadConfirmedOrder(): ConfirmedOrder | null {
  if (typeof sessionStorage === "undefined") return null;
  migrateOrderStorage();
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
