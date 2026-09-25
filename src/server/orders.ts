import { createServerFn } from "@tanstack/react-start";

import type { ConfirmedOrderItem } from "@/lib/order-confirmation";
import type { DeliveryMethod } from "@/lib/order-totals";

export type OrderStatus = "new" | "processing" | "shipped" | "delivered" | "cancelled";

export interface StoredOrderDto {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  customer: {
    userId?: string;
    name: string;
    email: string;
    phone: string;
    isGuest: boolean;
  };
  shippingAddress: {
    street: string;
    city: string;
    zip: string;
  };
  deliveryMethod: DeliveryMethod;
  deliveryLabel: string;
  estimatedDelivery: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  items: ConfirmedOrderItem[];
  payment?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };
}

/**
 * Client-safe RPC wrappers. Handlers dynamically import `orders.server.ts`
 * so mysql2/Node APIs never enter the browser bundle (admin hydration break).
 */
export const listOrders = createServerFn({ method: "GET" }).handler(async () => {
  const { listOrdersImpl } = await import("@/server/orders.server");
  return listOrdersImpl();
});

export const listMyOrders = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchMyOrdersForSession } = await import("@/server/orders.server");
  return fetchMyOrdersForSession();
});

export const createOrder = createServerFn({ method: "POST" })
  .validator(
    (data: {
      orderNumber: string;
      customer: {
        userId?: string;
        name: string;
        email: string;
        phone: string;
        isGuest: boolean;
      };
      shippingAddress: { street: string; city: string; zip: string };
      deliveryMethod: DeliveryMethod;
      deliveryLabel: string;
      estimatedDelivery: string;
      subtotal: number;
      shipping: number;
      tax: number;
      total: number;
      items: Array<ConfirmedOrderItem & { productId?: string }>;
      payment?: {
        razorpayOrderId?: string;
        razorpayPaymentId?: string;
      };
    }) => data,
  )
  .handler(async ({ data }) => {
    const { createOrderImpl } = await import("@/server/orders.server");
    return createOrderImpl(data);
  });

export const updateOrderStatusById = createServerFn({ method: "POST" })
  .validator((data: { id: string; status: OrderStatus }) => data)
  .handler(async ({ data }) => {
    const { updateOrderStatusImpl } = await import("@/server/orders.server");
    return updateOrderStatusImpl(data);
  });
