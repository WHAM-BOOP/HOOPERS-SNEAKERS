import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { Notice } from "@/components/ui/notice";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return (
      <Notice tone="danger" title="Supabase is not configured">
        Add your environment variables (see /setup) to manage orders.
      </Notice>
    );
  }

  const { data: order, error } = await admin
    .from("orders")
    .select(
      `*,
       order_items ( id, product_id, product_name, size, quantity, unit_price_cents )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <Notice tone="danger" title="Could not load the order">
        {error.message}
      </Notice>
    );
  }
  if (!order) notFound();

  const items =
    (order as unknown as {
      order_items: {
        id: string;
        product_id: string | null;
        product_name: string;
        size: string;
        quantity: number;
        unit_price_cents: number;
      }[];
    }).order_items ?? [];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={`Order ${order.order_number}`}
        description={`Placed ${formatDate(order.created_at)} · ${order.full_name}`}
        action={
          <Link href="/admin/orders" className="btn-outline">
            ← Back to orders
          </Link>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section aria-labelledby="items-heading" className="rounded-md border border-line bg-surface">
            <h2 id="items-heading" className="border-b border-line px-5 py-4 text-[15px] font-bold">
              Items
            </h2>
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-[14px]">
                  <div>
                    {item.product_id ? (
                      <Link
                        href={`/admin/products/${item.product_id}`}
                        className="font-semibold hover:text-accent hover:underline"
                      >
                        {item.product_name}
                      </Link>
                    ) : (
                      <span className="font-semibold">{item.product_name}</span>
                    )}
                    <span className="block text-[12.5px] text-muted">
                      Size {item.size} · {formatMoney(item.unit_price_cents)} each
                      {item.product_id ? "" : " · product removed"}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatMoney(item.unit_price_cents * item.quantity)}
                    </p>
                    <p className="text-[12px] text-muted">× {item.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="border-t border-line px-5 py-4 text-[14px]">
              <div className="flex justify-between py-1">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatMoney(order.subtotal_cents)}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-muted">Shipping</dt>
                <dd>
                  {order.shipping_cents === 0 ? "Free" : formatMoney(order.shipping_cents)}
                </dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-line pt-3 text-[15px] font-bold">
                <dt>Total due on delivery</dt>
                <dd>{formatMoney(order.total_cents)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="address-heading" className="rounded-md border border-line bg-surface p-5">
            <h2 id="address-heading" className="text-[15px] font-bold">
              Delivery address
            </h2>
            <address className="mt-3 text-[14px] not-italic leading-relaxed text-muted">
              {order.full_name}
              <br />
              {order.address_line1}
              {order.address_line2 ? (
                <>
                  <br />
                  {order.address_line2}
                </>
              ) : null}
              <br />
              {order.city}, {order.state} {order.postal_code}
              <br />
              {order.country}
            </address>
            <dl className="mt-4 space-y-1.5 text-[13.5px]">
              <div className="flex gap-2">
                <dt className="w-20 font-semibold text-ink">Email</dt>
                <dd>
                  <a href={`mailto:${order.email}`} className="text-accent hover:underline">
                    {order.email}
                  </a>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 font-semibold text-ink">Phone</dt>
                <dd>
                  <a href={`tel:${order.phone}`} className="text-accent hover:underline">
                    {order.phone}
                  </a>
                </dd>
              </div>
            </dl>
            {order.note ? (
              <div className="mt-4 rounded-sm border border-line bg-paper px-4 py-3">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-muted">
                  Customer note
                </p>
                <p className="mt-1 text-[13.5px] text-ink">{order.note}</p>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="h-fit rounded-md border border-line bg-surface p-5">
          <h2 className="text-[15px] font-bold">Order status</h2>
          <p className="mt-1.5 text-[13px] text-muted">
            Status changes are saved immediately and enforced server-side.
          </p>
          <div className="mt-4">
            <OrderStatusControl orderId={order.id} currentStatus={order.status} />
          </div>
        </aside>
      </div>
    </div>
  );
}
