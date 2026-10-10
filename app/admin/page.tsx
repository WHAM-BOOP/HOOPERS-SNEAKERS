import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OrderRow } from "@/lib/supabase/types";
import { formatDate, formatMoney } from "@/lib/utils";

const STATUS_TONE: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  pending: "warning",
  confirmed: "accent",
  processing: "accent",
  shipped: "accent",
  delivered: "success",
  cancelled: "danger",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return (
      <Notice tone="danger" title="Supabase is not configured">
        Add your environment variables (see /setup) to load dashboard data.
      </Notice>
    );
  }

  const [{ count: productCount }, { count: orderCount }, recentResult, pendingResult] =
    await Promise.all([
      admin.from("products").select("id", { count: "exact", head: true }),
      admin.from("orders").select("id", { count: "exact", head: true }),
      admin
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  // Revenue = sum of delivered + shipped + processing + confirmed totals.
  const { data: revenueRows } = await admin
    .from("orders")
    .select("total_cents, status")
    .in("status", ["confirmed", "processing", "shipped", "delivered"]);

  const revenueCents = (revenueRows ?? []).reduce(
    (sum, row) => sum + (row.total_cents ?? 0),
    0,
  );

  const recentOrders = (recentResult.data ?? []) as OrderRow[];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Overview"
        description="Live numbers from your database — orders, products, and revenue (non-cancelled)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Products" value={String(productCount ?? 0)} />
        <StatCard label="Orders" value={String(orderCount ?? 0)} />
        <StatCard label="Pending orders" value={String(pendingResult.count ?? 0)} highlight />
        <StatCard label="Revenue (non-cancelled)" value={formatMoney(revenueCents)} />
      </div>

      <section aria-labelledby="recent-heading">
        <div className="flex items-center justify-between">
          <h2 id="recent-heading" className="text-lg font-bold">
            Recent orders
          </h2>
          <Link href="/admin/orders" className="text-[13.5px] font-semibold text-accent hover:underline">
            View all orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-line-strong px-6 py-10 text-center text-[14px] text-muted">
            No orders yet. They will appear here as customers check out.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-md border border-line bg-surface">
            <table className="w-full min-w-[720px] text-left text-[13.5px]">
              <caption className="sr-only">Eight most recent orders</caption>
              <thead>
                <tr className="border-b border-line bg-paper text-[12px] uppercase tracking-wider text-muted">
                  <th scope="col" className="px-4 py-3 font-semibold">Order</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-semibold hover:text-accent hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {order.full_name}
                      <span className="block text-[12px] text-muted">{order.email}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatMoney(order.total_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-5 py-5 ${
        highlight ? "border-accent/40 bg-accent-soft" : "border-line bg-surface"
      }`}
    >
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
