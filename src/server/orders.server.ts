import type { ConfirmedOrderItem } from "@/lib/order-confirmation";
import type { DeliveryMethod } from "@/lib/order-totals";
import { execute, getPool, query, queryOne } from "@/server/db";
import type { OrderStatus, StoredOrderDto } from "@/server/orders";

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
  tax: number;
  total: number;
  status: OrderStatus;
  created_at: Date;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
}

interface OrderItemRow {
  order_id: string;
  product_id: string | null;
  name: string;
  subtitle: string | null;
  image: string | null;
  quantity: number;
  line_price: number;
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
  }));
}

function mapOrderRow(row: OrderRow, items: ConfirmedOrderItem[]): StoredOrderDto {
  const razorpayOrderId = row.razorpay_order_id?.trim() || undefined;
  const razorpayPaymentId = row.razorpay_payment_id?.trim() || undefined;

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
    tax: Number(row.tax),
    total: Number(row.total),
    items,
    payment:
      razorpayOrderId || razorpayPaymentId
        ? { razorpayOrderId, razorpayPaymentId }
        : undefined,
  };
}

export async function listOrdersImpl(): Promise<StoredOrderDto[]> {
  const rows = await query<OrderRow>("SELECT * FROM orders ORDER BY created_at DESC");
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

export async function fetchMyOrdersForSession(): Promise<StoredOrderDto[]> {
  const { resolveSessionUser } = await import("@/server/session-resolve");
  const session = await resolveSessionUser();
  if (!session?.email && !session?.id) return [];
  return fetchOrdersForCustomer({ email: session.email, userId: session.id });
}

export async function createOrderImpl(data: {
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
}): Promise<StoredOrderDto> {
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
        subtotal, shipping_cost, tax, total, status,
        razorpay_order_id, razorpay_payment_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
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
        data.tax,
        data.total,
        data.payment?.razorpayOrderId ?? null,
        data.payment?.razorpayPaymentId ?? null,
      ],
    );

    for (const item of data.items) {
      await connection.execute(
        `INSERT INTO order_items (
          order_id, product_id, name, subtitle, image, quantity, line_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.productId ?? null,
          item.name,
          item.subtitle,
          item.image,
          item.quantity,
          item.linePrice,
        ],
      );

      if (item.productId) {
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

  const row = await queryOne<OrderRow>("SELECT * FROM orders WHERE id = ?", [id]);
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

export async function updateOrderStatusImpl(data: {
  id: string;
  status: OrderStatus;
}): Promise<StoredOrderDto> {
  const previous = await queryOne<OrderRow>("SELECT * FROM orders WHERE id = ?", [
    data.id,
  ]);
  if (!previous) throw new Error("Order not found.");

  await execute("UPDATE orders SET status = ? WHERE id = ?", [data.status, data.id]);
  const row = await queryOne<OrderRow>("SELECT * FROM orders WHERE id = ?", [data.id]);
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
