import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";

import {
  confirmManualPaymentById,
  listOrders,
  updateOrderStatusById,
  type OrderStatus,
  type StoredOrderDto,
} from "@/server/orders";

export type { OrderStatus };

export type StoredOrder = StoredOrderDto;

interface OrdersContextValue {
  orders: StoredOrder[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  confirmManualPayment: (id: string) => Promise<StoredOrder>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  getOrder: (id: string) => StoredOrder | undefined;
  recentOrders: StoredOrder[];
  pendingCount: number;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listOrders();
      setOrders(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Storefront skips this — loading every order on Home/Shop made the site crawl.
  // Re-fetch when entering admin so new DB rows show after a soft navigate.
  useEffect(() => {
    if (!pathname.startsWith("/admin")) return;
    void refresh();
  }, [pathname, refresh]);

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      const updated = await updateOrderStatusById({ data: { id, status } });
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    },
    [],
  );

  const confirmManualPayment = useCallback(
    async (id: string) => {
      const updated = await confirmManualPaymentById({
        data: { id },
      });
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      return updated;
    },
    [],
  );

  const getOrder = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders],
  );

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders],
  );

  const pendingCount = useMemo(
    () =>
      orders.filter((o) => o.status === "new" || o.status === "processing")
        .length,
    [orders],
  );

  const value = useMemo(
    () => ({
      orders: recentOrders,
      loading,
      error,
      refresh,
      confirmManualPayment,
      updateOrderStatus,
      getOrder,
      recentOrders,
      pendingCount,
    }),
    [
      recentOrders,
      loading,
      error,
      refresh,
      confirmManualPayment,
      updateOrderStatus,
      getOrder,
      pendingCount,
    ],
  );

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}

export function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  new: "New",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const orderStatusStyles: Record<OrderStatus, string> = {
  new: "bg-burgundy/15 text-burgundy",
  processing: "bg-amber-100 text-amber-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
};
