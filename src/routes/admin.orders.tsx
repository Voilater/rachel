import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Package, User, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  formatOrderDate,
  orderStatusLabels,
  orderStatusStyles,
  type OrderStatus,
  type StoredOrder,
  useOrders,
} from "@/lib/orders-store";
import { formatIntention } from "@/lib/order-confirmation";
import { formatWeightGrams } from "@/lib/order-totals";
import type { PaymentReceiptOcrResult } from "@/lib/payment-receipt-ocr";
import { formatPrice, siteConfig } from "@/lib/site-data";
import { getUpiPaymentReport } from "@/server/payment";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [{ title: `Orders — ${siteConfig.name} Admin` }],
  }),
  component: AdminOrdersPage,
});

const STATUS_OPTIONS: OrderStatus[] = [
  "new",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function AdminOrdersPage() {
  const {
    orders,
    loading,
    error,
    refresh,
    confirmManualPayment,
    updateOrderStatus,
  } = useOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<StoredOrder | null>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [confirmPaymentError, setConfirmPaymentError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = orders.filter((order) => {
    const q = search.toLowerCase();
    const paymentId = order.payment?.paymentId?.toLowerCase() ?? "";
    const matchesSearch =
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.customer.name.toLowerCase().includes(q) ||
      order.customer.email.toLowerCase().includes(q) ||
      order.customer.phone.toLowerCase().includes(q) ||
      paymentId.includes(q) ||
      (order.payment?.transactionReference?.toLowerCase().includes(q) ?? false);
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-burgundy md:text-3xl">
            Orders
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {orders.length} order{orders.length !== 1 ? "s" : ""} from customers
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search order #, payment reference, name, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as OrderStatus | "all")
          }
          className="w-full rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-burgundy/20 sm:w-auto"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {orderStatusLabels[s]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-blush-section"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {loading && orders.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Loading orders…
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-white p-12 text-center">
          <Package className="mx-auto size-12 text-muted-foreground/40" />
          <p className="mt-4 font-medium text-foreground">No orders yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            When logged-in customers complete checkout, orders appear here
            automatically.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onToggle={() => toggleExpand(order.id)}
              onViewDetail={() => {
                setConfirmPaymentError(null);
                setDetailOrder(order);
              }}
              onStatusChange={(status) => updateOrderStatus(order.id, status)}
            />
          ))}
        </div>
      )}

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onStatusChange={(status) => {
            updateOrderStatus(detailOrder.id, status);
            setDetailOrder({ ...detailOrder, status });
          }}
          isConfirmingPayment={isConfirmingPayment}
          confirmPaymentError={confirmPaymentError}
          onConfirmPayment={() => {
            setIsConfirmingPayment(true);
            setConfirmPaymentError(null);
            void confirmManualPayment(detailOrder.id)
              .then((updated) => setDetailOrder(updated))
              .catch((err: unknown) =>
                setConfirmPaymentError(
                  err instanceof Error
                    ? err.message
                    : "Could not confirm payment.",
                ),
              )
              .finally(() => setIsConfirmingPayment(false));
          }}
        />
      )}
    </div>
  );
}

function OrderCard({
  order,
  expanded,
  onToggle,
  onViewDetail,
  onStatusChange,
}: {
  order: StoredOrder;
  expanded: boolean;
  onToggle: () => void;
  onViewDetail: () => void;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-4 md:p-5">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex -space-x-2 shrink-0">
            {order.items.slice(0, 3).map((item, i) => (
              <img
                key={`${item.name}-${i}`}
                src={item.image}
                alt=""
                className="size-10 rounded-lg border-2 border-white object-cover"
              />
            ))}
            {order.items.length > 3 && (
              <span className="flex size-10 items-center justify-center rounded-lg border-2 border-white bg-blush-section text-xs font-medium text-burgundy">
                +{order.items.length - 3}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-foreground">
                #{order.orderNumber}
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusStyles[order.status]}`}
              >
                {orderStatusLabels[order.status]}
              </span>
              {order.payment?.status === "pending" ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  Payment pending verification
                </span>
              ) : null}
              {order.payment?.status === "paid" ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  Payment verified
                </span>
              ) : null}
              {order.customer.isGuest ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Guest
                </span>
              ) : (
                <span className="rounded-full bg-burgundy/10 px-2 py-0.5 text-xs font-medium text-burgundy">
                  Registered
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground break-words">
              {order.customer.name} · {order.customer.email}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatOrderDate(order.createdAt)}
            </p>
            {order.payment?.paymentId ? (
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                Payment reference: {order.payment.paymentId}
              </p>
            ) : null}
            {order.payment?.transactionReference ||
            order.payment?.status === "pending" ? (
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                UTR: {order.payment?.transactionReference ?? "Not submitted"}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4 sm:justify-start">
            <div>
              <p className="font-serif text-xl font-semibold text-burgundy">
                {formatPrice(order.total)}
              </p>
              <p className="text-xs text-muted-foreground">
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </p>
            </div>

            <select
              value={order.status}
              onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
              className="max-w-[11rem] rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-burgundy/20 sm:max-w-none"
              aria-label="Order status"
            >
              {STATUS_OPTIONS.map((s) => (
                <option
                  key={s}
                  value={s}
                  disabled={
                    order.payment?.status === "pending" &&
                    ["processing", "shipped", "delivered"].includes(s)
                  }
                >
                  {orderStatusLabels[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onViewDetail}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider text-burgundy hover:bg-blush-section sm:flex-none"
            >
              {order.payment?.status === "pending"
                ? "Review payment"
                : "Details"}
            </button>

            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-blush-section"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <ChevronUp className="size-5" />
              ) : (
                <ChevronDown className="size-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-blush-section/30 px-4 py-5 md:px-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Customer
              </p>
              <p className="mt-2 font-medium">{order.customer.name}</p>
              <p className="text-sm text-muted-foreground">
                {order.customer.email}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.customer.phone}
              </p>
              {order.payment?.paymentId ? (
                <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
                  Payment reference: {order.payment.paymentId}
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Shipping
              </p>
              <p className="mt-2 text-sm">{order.shippingAddress.street}</p>
              <p className="text-sm text-muted-foreground">
                {order.shippingAddress.city}, {order.shippingAddress.zip}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {order.deliveryLabel}
              </p>
              <p className="text-sm text-burgundy">{order.estimatedDelivery}</p>
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            {order.items.map((item, index) => (
              <li
                key={`${item.name}-${index}`}
                className="flex gap-3 rounded-lg bg-white p-3"
              >
                <img
                  src={item.image}
                  alt=""
                  className="size-12 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatIntention(item.subtitle)}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">
                    {formatPrice(item.linePrice * item.quantity)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty {item.quantity}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
  isConfirmingPayment,
  confirmPaymentError,
  onConfirmPayment,
}: {
  order: StoredOrder;
  onClose: () => void;
  onStatusChange: (status: OrderStatus) => void;
  isConfirmingPayment: boolean;
  confirmPaymentError: string | null;
  onConfirmPayment: () => void;
}) {
  const [receiptReport, setReceiptReport] =
    useState<PaymentReceiptOcrResult | null>(null);
  const [isLoadingReceiptReport, setIsLoadingReceiptReport] = useState(false);
  const [receiptReportError, setReceiptReportError] = useState<string | null>(
    null,
  );
  useEffect(() => {
    setReceiptReport(null);
    setReceiptReportError(null);
  }, [order.id]);

  const loadReceiptReport = async () => {
    setIsLoadingReceiptReport(true);
    setReceiptReportError(null);
    try {
      const report = await getUpiPaymentReport({
        data: { orderId: order.id },
      });
      if (!report) {
        setReceiptReportError(
          "No OCR payment details are stored for this order.",
        );
        setReceiptReport(null);
      } else {
        setReceiptReport(report);
      }
    } catch (error) {
      setReceiptReportError(
        error instanceof Error
          ? error.message
          : "Could not load OCR payment details.",
      );
      setReceiptReport(null);
    } finally {
      setIsLoadingReceiptReport(false);
    }
  };
  const receiptFields: Array<[string, string | null]> = receiptReport
    ? [
        [
          "Amount read",
          receiptReport.amount === null
            ? null
            : formatPrice(receiptReport.amount),
        ],
        ["Transaction ID / UTR", receiptReport.transactionReference],
        ["Order reference read", receiptReport.orderReference],
        ["Status read", receiptReport.paymentStatus],
        ["Date / time read", receiptReport.paidAt],
        ["Payee name", receiptReport.payeeName],
        ["Payee UPI ID", receiptReport.payeeUpiId],
        ["Payer name", receiptReport.payerName],
        ["Payer bank", receiptReport.payerBank],
        ["Payer account label", receiptReport.payerBankAccount],
        ["Payer UPI ID", receiptReport.payerUpiId],
        [
          "OCR confidence",
          receiptReport.confidence === null
            ? null
            : `${Math.round(receiptReport.confidence)}%`,
        ],
      ].filter((field): field is [string, string] => Boolean(field[1]))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
          <div>
            <h2 className="font-serif text-xl text-burgundy">
              Order #{order.orderNumber}
            </h2>
            <p className="text-sm text-muted-foreground">
              {formatOrderDate(order.createdAt)}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${orderStatusStyles[order.status]}`}
            >
              {orderStatusLabels[order.status]}
            </span>
            <select
              value={order.status}
              onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option
                  key={s}
                  value={s}
                  disabled={
                    order.payment?.status === "pending" &&
                    ["processing", "shipped", "delivered"].includes(s)
                  }
                >
                  Mark as {orderStatusLabels[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <section className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <User className="size-4" />
                Customer
              </div>
              <p className="mt-3 font-medium">{order.customer.name}</p>
              <p className="text-sm text-muted-foreground">
                {order.customer.email}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.customer.phone}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {order.customer.isGuest
                  ? "Guest checkout"
                  : "Registered account"}
              </p>
            </section>
            <section className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Package className="size-4" />
                Delivery
              </div>
              <p className="mt-3 text-sm">{order.shippingAddress.street}</p>
              <p className="text-sm text-muted-foreground">
                {order.shippingAddress.city}, {order.shippingAddress.zip}
              </p>
              <p className="mt-3 text-sm font-medium">{order.deliveryLabel}</p>
              <p className="text-sm text-burgundy">{order.estimatedDelivery}</p>
            </section>
          </div>

          {order.payment?.paymentId && (
            <section className="mt-6 rounded-xl border border-border p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {order.payment.provider ?? "Payment"} reference
              </p>
              {order.payment.transactionReference ? (
                <p className="mt-1 break-all font-mono text-sm text-foreground">
                  UTR: {order.payment.transactionReference}
                </p>
              ) : null}
              <p className="mt-3 break-all font-mono text-sm text-foreground">
                Order reference: {order.payment.paymentId}
              </p>
              {order.payment.provider === "UPI QR" ? (
                <div className="mt-4">
                  <button
                    type="button"
                    disabled={isLoadingReceiptReport}
                    onClick={() => void loadReceiptReport()}
                    className="rounded-lg border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-burgundy disabled:opacity-60"
                  >
                    {isLoadingReceiptReport
                      ? "Loading OCR details…"
                      : "View OCR payment details"}
                  </button>
                  {receiptReportError ? (
                    <p className="mt-2 text-sm text-red-700">
                      {receiptReportError}
                    </p>
                  ) : null}
                  {receiptReport ? (
                    <div className="mt-3 rounded-lg bg-blush-section p-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        OCR read values — unverified
                      </p>
                      <dl className="mt-2 space-y-1 text-sm">
                        {receiptFields.map(([label, value]) => (
                          <div
                            key={label}
                            className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-3"
                          >
                            <dt className="text-muted-foreground">{label}</dt>
                            <dd className="break-all font-medium">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <p className="mt-3 text-xs leading-relaxed text-amber-900">
                        OCR text can be wrong or altered. Confirm payment only
                        after matching the UTR in your bank/UPI records.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {order.payment.provider === "UPI QR" &&
              order.payment.status === "pending" &&
              order.status !== "cancelled" ? (
                <div className="mt-4">
                  <p className="mb-3 text-xs leading-relaxed text-amber-800">
                    Verify the exact amount and UTR in the bank/UPI records
                    before confirming. The customer-provided reference and email
                    alerts are not proof of payment.
                  </p>
                  {confirmPaymentError ? (
                    <p role="alert" className="mb-3 text-sm text-red-700">
                      {confirmPaymentError}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    disabled={isConfirmingPayment}
                    onClick={onConfirmPayment}
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-60"
                  >
                    {isConfirmingPayment
                      ? "Confirming…"
                      : "Confirm payment received"}
                  </button>
                </div>
              ) : null}
            </section>
          )}

          <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Items
          </h3>
          <ul className="mt-3 space-y-3">
            {order.items.map((item, index) => (
              <li
                key={`${item.name}-${index}`}
                className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-start"
              >
                <img
                  src={item.image}
                  alt=""
                  className="size-16 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatIntention(item.subtitle)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Qty: {item.quantity}
                    {item.weightGrams
                      ? ` · ${formatWeightGrams(item.weightGrams)} each`
                      : ""}
                  </p>
                </div>
                <p className="font-semibold sm:text-right">
                  {formatPrice(item.linePrice * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>
                {order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}
              </dd>
            </div>
            {order.processingFee > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Processing fee</dt>
                <dd>{formatPrice(order.processingFee)}</dd>
              </div>
            ) : null}
            {order.shipmentWeightGrams > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipment weight</dt>
                <dd>
                  {formatWeightGrams(order.shipmentWeightGrams)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tax</dt>
              <dd>{formatPrice(order.tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd className="font-serif text-burgundy">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
