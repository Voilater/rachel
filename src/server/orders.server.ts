import type { ConfirmedOrderItem } from "@/lib/order-confirmation";
import type { DeliveryMethod } from "@/lib/order-totals";
import { requireAdminSession } from "@/server/admin-session.server";
import { execute, getPool, query, queryOne } from "@/server/db";
import type {
  CreateOrderInput,
  PaymentStatus,
  OrderStatus,
  StoredOrderDto,
} from "@/server/orders";

interface OrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  is_guest: boolean;
  shipping_street: string;
  shipping_city: string;
  shipping_zip: string;
  delivery_method: string;
  delivery_label: string;
  estimated_delivery: string;
  subtotal: number;
  shipping_cost: number;
  processing_fee: number;
  shipment_weight_grams: number;
  tax: number;
  total: number;
  status: OrderStatus;
  payment_status?: PaymentStatus;
  created_at: Date;
  payment_provider?: string | null;
  payment_id?: string | null;
  payment_transaction_reference?: string | null;
}

interface OrderItemRow {
  order_id: string;
  product_id: string | null;
  name: string;
  subtitle: string | null;
  image: string | null;
  quantity: number;
  line_price: number;
  weight_grams: number;
}

async function loadOrderItems(orderId: string): Promise<ConfirmedOrderItem[]> {
  const rows = await query<OrderItemRow>(
    "SELECT * FROM order_items WHERE order_id = ? ORDER BY id",
    [orderId],
  );
  return rows.map((row) => ({
    name: row.name,
    subtitle: row.subtitle ?? "",
    image: row.image ?? "",
    quantity: row.quantity,
    linePrice: Number(row.line_price),
    weightGrams: Number(row.weight_grams) || undefined,
  }));
}

function mapOrderRow(
  row: OrderRow,
  items: ConfirmedOrderItem[],
): StoredOrderDto {
  const provider = row.payment_provider?.trim() || undefined;
  const paymentId = row.payment_id?.trim() || undefined;

  return {
    id: row.id,
    orderNumber: row.order_number,
    createdAt: new Date(row.created_at).toISOString(),
    status: row.status,
    customer: {
      userId: row.user_id ?? undefined,
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      isGuest: Boolean(row.is_guest),
    },
    shippingAddress: {
      street: row.shipping_street,
      city: row.shipping_city,
      zip: row.shipping_zip,
    },
    deliveryMethod: row.delivery_method as DeliveryMethod,
    deliveryLabel: row.delivery_label,
    estimatedDelivery: row.estimated_delivery,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping_cost),
    processingFee: Number(row.processing_fee),
    shipmentWeightGrams: Number(row.shipment_weight_grams),
    tax: Number(row.tax),
    total: Number(row.total),
    items,
    payment:
      provider || paymentId
        ? {
            provider,
            paymentId,
            transactionReference:
              row.payment_transaction_reference?.trim() || undefined,
            status: row.payment_status ?? "paid",
          }
        : undefined,
  };
}

export async function listOrdersImpl(): Promise<StoredOrderDto[]> {
  await requireAdminSession();
  const rows = await query<OrderRow>(
    "SELECT * FROM orders ORDER BY created_at DESC",
  );
  const orders: StoredOrderDto[] = [];
  for (const row of rows) {
    const items = await loadOrderItems(row.id);
    orders.push(mapOrderRow(row, items));
  }
  return orders;
}

export async function fetchOrdersForCustomer(opts: {
  email?: string | null;
  userId?: string | null;
}): Promise<StoredOrderDto[]> {
  const email = opts.email?.trim().toLowerCase() ?? "";
  const userId = opts.userId?.trim() ?? "";
  if (!email && !userId) return [];

  const rows = await query<OrderRow>(
    `SELECT * FROM orders
     WHERE ( ? <> '' AND LOWER(TRIM(customer_email)) = ? )
        OR ( ? <> '' AND user_id = ? )
     ORDER BY created_at DESC`,
    [email, email, userId, userId],
  );

  const orders: StoredOrderDto[] = [];
  for (const row of rows) {
    const items = await loadOrderItems(row.id);
    orders.push(mapOrderRow(row, items));
  }
  return orders;
}

export async function getOrderByNumberImpl(orderNumber: string) {
  const row = await queryOne<OrderRow>(
    "SELECT * FROM orders WHERE order_number = ?",
    [orderNumber],
  );
  if (!row) return null;
  return mapOrderRow(row, await loadOrderItems(row.id));
}

export async function fetchMyOrdersForSession(): Promise<StoredOrderDto[]> {
  const { resolveSessionUser } = await import("@/server/session-resolve");
  const session = await resolveSessionUser();
  if (!session?.email && !session?.id) return [];
  return fetchOrdersForCustomer({ email: session.email, userId: session.id });
}

export async function createOrderImpl(
  data: CreateOrderInput,
): Promise<StoredOrderDto> {
  await query("SELECT id FROM orders LIMIT 0");

  const id = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `INSERT INTO orders (
        id, order_number, user_id, customer_name, customer_email, customer_phone,
        is_guest, shipping_street, shipping_city, shipping_zip,
        delivery_method, delivery_label, estimated_delivery,
        subtotal, shipping_cost, processing_fee, shipment_weight_grams,
        tax, total, status,
        payment_provider, payment_id, payment_transaction_reference, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)`,
      [
        id,
        data.orderNumber,
        data.customer.userId ?? null,
        data.customer.name,
        data.customer.email,
        data.customer.phone,
        data.customer.isGuest,
        data.shippingAddress.street,
        data.shippingAddress.city,
        data.shippingAddress.zip,
        data.deliveryMethod,
        data.deliveryLabel,
        data.estimatedDelivery,
        data.subtotal,
        data.shipping,
        data.processingFee ?? 0,
        data.shipmentWeightGrams ?? 0,
        data.tax,
        data.total,
        data.payment?.provider ?? null,
        data.payment?.paymentId ?? null,
        data.payment?.transactionReference ?? null,
        data.payment?.status ?? "paid",
      ],
    );

    for (const item of data.items) {
      await connection.execute(
        `INSERT INTO order_items (
          order_id, product_id, name, subtitle, image, quantity, line_price,
          weight_grams
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.productId ?? null,
          item.name,
          item.subtitle,
          item.image,
          item.quantity,
          item.linePrice,
          item.weightGrams ?? 0,
        ],
      );

      if (item.productId && data.payment?.status !== "pending") {
        await connection.execute(
          "UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?",
          [item.quantity, item.productId],
        );
      }
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  const row = await queryOne<OrderRow>("SELECT * FROM orders WHERE id = ?", [
    id,
  ]);
  if (!row) throw new Error("Failed to create order.");
  const items = await loadOrderItems(id);
  const mapped = mapOrderRow(row, items);

  const { writeAuditLog } = await import("@/server/audit-log.server");
  await writeAuditLog({
    action: "order.create",
    status: "success",
    userId: data.customer.userId ?? null,
    email: data.customer.email,
    message: `Order ${data.orderNumber} created`,
    metadata: {
      orderId: id,
      orderNumber: data.orderNumber,
      total: data.total,
      itemCount: data.items.length,
      isGuest: data.customer.isGuest,
      city: data.shippingAddress.city,
      zip: data.shippingAddress.zip,
      deliveryMethod: data.deliveryMethod,
    },
  });

  return mapped;
}

export async function confirmManualPaymentImpl(data: {
  id: string;
}): Promise<StoredOrderDto> {
  await requireAdminSession();

  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orderRows] = await connection.execute(
      "SELECT id, payment_provider, payment_status FROM orders WHERE id = ? FOR UPDATE",
      [data.id],
    );
    const order = (
      orderRows as Array<{
        id: string;
        payment_provider: string | null;
        payment_status: PaymentStatus;
      }>
    )[0];
    if (!order) throw new Error("Order not found.");
    if (order.payment_provider !== "UPI QR") {
      throw new Error("Only direct UPI orders can be manually confirmed.");
    }
    if (order.payment_status === "paid") {
      await connection.commit();
      const alreadyPaid = await queryOne<OrderRow>(
        "SELECT * FROM orders WHERE id = ?",
        [data.id],
      );
      if (!alreadyPaid) throw new Error("Confirmed order could not be loaded.");
      return mapOrderRow(alreadyPaid, await loadOrderItems(data.id));
    }
    if (order.payment_status !== "pending") {
      throw new Error("This payment report is not pending verification.");
    }
    const [orderStatusRows] = await connection.execute(
      "SELECT status FROM orders WHERE id = ?",
      [data.id],
    );
    if (
      (orderStatusRows as Array<{ status: OrderStatus }>)[0]?.status ===
      "cancelled"
    ) {
      throw new Error("A cancelled order cannot have its payment confirmed.");
    }

    const [itemRows] = await connection.execute(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [data.id],
    );
    for (const row of itemRows as Array<{
      product_id: string | null;
      quantity: number;
    }>) {
      if (!row.product_id) continue;
      const [result] = await connection.execute(
        "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
        [row.quantity, row.product_id, row.quantity],
      );
      if ((result as { affectedRows: number }).affectedRows !== 1) {
        throw new Error("Not enough stock remains to confirm this order.");
      }
    }

    await connection.execute(
      "UPDATE orders SET payment_status = 'paid' WHERE id = ?",
      [data.id],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const row = await queryOne<OrderRow>("SELECT * FROM orders WHERE id = ?", [
    data.id,
  ]);
  if (!row) throw new Error("Confirmed order could not be loaded.");
  return mapOrderRow(row, await loadOrderItems(data.id));
}

export async function updateOrderStatusImpl(data: {
  id: string;
  status: OrderStatus;
}): Promise<StoredOrderDto> {
  await requireAdminSession();
  const previous = await queryOne<OrderRow>(
    "SELECT * FROM orders WHERE id = ?",
    [data.id],
  );
  if (!previous) throw new Error("Order not found.");
  if (
    previous.payment_status === "pending" &&
    ["processing", "shipped", "delivered"].includes(data.status)
  ) {
    throw new Error("Verify the UPI payment before fulfilling this order.");
  }

  await execute("UPDATE orders SET status = ? WHERE id = ?", [
    data.status,
    data.id,
  ]);
  const row = await queryOne<OrderRow>("SELECT * FROM orders WHERE id = ?", [
    data.id,
  ]);
  if (!row) throw new Error("Order not found.");
  const items = await loadOrderItems(data.id);
  const mapped = mapOrderRow(row, items);

  if (previous.status !== data.status) {
    try {
      const { sendOrderStatusEmail } = await import("@/server/mail.server");
      const mailResult = await sendOrderStatusEmail({
        to: row.customer_email,
        customerName: row.customer_name,
        orderNumber: row.order_number,
        status: data.status,
        total: Number(row.total),
      });

      const { writeAuditLog } = await import("@/server/audit-log.server");
      await writeAuditLog({
        action: "order.status_email",
        status: mailResult.sent ? "success" : "info",
        email: row.customer_email,
        message: mailResult.sent
          ? `Status email sent for ${row.order_number} → ${data.status}`
          : `Status email skipped for ${row.order_number} (SMTP not configured)`,
        metadata: {
          orderId: row.id,
          orderNumber: row.order_number,
          fromStatus: previous.status,
          toStatus: data.status,
          mail: mailResult,
        },
      });
    } catch (err) {
      console.error("[mail] Failed to send order status email:", err);
      try {
        const { writeAuditLog } = await import("@/server/audit-log.server");
        await writeAuditLog({
          action: "order.status_email",
          status: "failure",
          email: row.customer_email,
          message: `Status email failed for ${row.order_number} → ${data.status}`,
          metadata: {
            orderId: row.id,
            orderNumber: row.order_number,
            fromStatus: previous.status,
            toStatus: data.status,
            error: err instanceof Error ? err.message : String(err),
          },
        });
      } catch {
        // Don't block status updates if audit logging fails.
      }
    }
  }

  return mapped;
}
