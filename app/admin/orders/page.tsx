import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { Pagination } from "@/components/ui/pagination";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { clamp, formatDate, formatMoney } from "@/lib/utils";

const STATUS_TONE: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  pending: "warning",
  confirmed: "accent",
  processing: "accent",
  shipped: "accent",
  delivered: "success",
  cancelled: "danger",
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = 20;

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const statusRaw = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const pageRaw = Number(Array.isArray(sp.page) ? sp.page[0] : (sp.page ?? "1"));
  const page = Number.isFinite(pageRaw) ? clamp(Math.trunc(pageRaw), 1, 10_000) : 1;

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return (
      <Notice tone="danger" title="Supabase is not configured">
        Add your environment variables (see /setup) to manage orders.
      </Notice>
    );
  }

  let query = admin
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  const validStatus = STATUS_FILTERS.some((f) => f.value === statusRaw && f.value);
  if (validStatus && statusRaw) {
    query = query.eq("status", statusRaw as never);
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);

  if (error) {
    return (
      <Notice tone="danger" title="Could not load orders">
        {error.message}
      </Notice>
    );
  }

  const orders = data ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description="Pay-on-delivery orders. Update the status as each one progresses."
      />

      <nav aria-label="Filter orders by status" className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = (statusRaw ?? "") === filter.value;
          return (
            <Link
              key={filter.label}
              href={
                filter.value
                  ? `/admin/orders?status=${filter.value}`
                  : "/admin/orders"
              }
              aria-current={active ? "page" : undefined}
              className={`rounded-sm px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                active
                  ? "bg-ink text-paper"
                  : "border border-line-strong hover:border-ink"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <p className="rounded-md border border-dashed border-line-strong px-6 py-12 text-center text-[14px] text-muted">
          No orders
          {statusRaw ? ` with status "${statusRaw}"` : ""} yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <table className="w-full min-w-[820px] text-left text-[13.5px]">
            <caption className="sr-only">Orders, newest first</caption>
            <thead>
              <tr className="border-b border-line bg-paper text-[12px] uppercase tracking-wider text-muted">
                <th scope="col" className="px-4 py-3 font-semibold">Order</th>
                <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                <th scope="col" className="px-4 py-3 font-semibold">Ship to</th>
                <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((order) => (
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
                  <td className="px-4 py-3 text-muted">
                    {order.city}, {order.state}
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

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/orders"
        query={{ status: statusRaw }}
      />
    </div>
  );
}
