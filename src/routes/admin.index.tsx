import { createFileRoute, Link } from "@tanstack/react-router";

import { useInventory } from "@/lib/inventory-store";
import {
  formatOrderDate,
  orderStatusLabels,
  orderStatusStyles,
  useOrders,
} from "@/lib/orders-store";
import { formatPrice, siteConfig } from "@/lib/site-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: `Admin Dashboard — ${siteConfig.name}` }],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { products, lowStockProducts, totalStock, inventoryValue } = useInventory();
  const { recentOrders, pendingCount } = useOrders();

  const outOfStock = products.filter((p) => p.stock === 0);

  return (
    <div>
      <h1 className="font-serif text-2xl text-burgundy md:text-3xl">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground md:text-base">
        Studio overview — orders &amp; inventory
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Open orders" value={String(pendingCount)} highlight />
        <StatCard label="Total orders" value={String(recentOrders.length)} />
        <StatCard label="Total SKUs" value={String(products.length)} />
        <StatCard label="Units in stock" value={String(totalStock)} />
        <StatCard label="Inventory value" value={formatPrice(inventoryValue)} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-foreground">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm font-medium text-burgundy hover:underline">
              View all →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No customer orders yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentOrders.slice(0, 5).map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">#{order.orderNumber}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.customer.name} · {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-burgundy">{formatPrice(order.total)}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${orderStatusStyles[order.status]}`}
                    >
                      {orderStatusLabels[order.status]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-serif text-xl text-foreground">Low stock alerts</h2>
          {lowStockProducts.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">All items are well stocked.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lowStockProducts.slice(0, 5).map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="font-medium text-burgundy">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/admin/inventory"
            className="mt-4 text-sm font-medium text-burgundy hover:underline"
          >
            Manage inventory →
          </Link>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-serif text-xl text-foreground">Out of stock</h2>
          {outOfStock.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No out-of-stock items.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {outOfStock.slice(0, 5).map((p) => (
                <li key={p.id} className="text-sm text-muted-foreground">{p.name}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={`mt-2 font-serif text-2xl ${highlight ? "text-burgundy" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}
