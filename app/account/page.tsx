import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SetupHelpCard } from "@/components/ui/setup-help-card";
import { getCurrentUser } from "@/lib/auth/session";
import { getEnvStatus } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OrderRow } from "@/lib/supabase/types";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

const STATUS_TONE: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  pending: "warning",
  confirmed: "accent",
  processing: "accent",
  shipped: "accent",
  delivered: "success",
  cancelled: "danger",
};

export default async function AccountPage() {
  const status = getEnvStatus();
  if (!status.supabaseReady) {
    return (
      <div className="container-page py-10">
        <SetupHelpCard />
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/sign-in?next=/account");
  }

  const supabase = await createSupabaseServerClient();
  const orders = supabase
    ? (
        await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)
      ).data ?? []
    : [];

  return (
    <div className="container-page py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="mt-2 text-3xl font-bold">Hello, {user.displayName}</h1>
          <p className="mt-2 text-[14.5px] text-muted">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {user.isAdmin ? (
            <Link href="/admin" className="btn-secondary">
              Admin dashboard
            </Link>
          ) : null}
          <form action="/auth/sign-out" method="post">
            <button type="submit" className="btn-outline">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section aria-labelledby="orders-heading" className="mt-10">
        <h2 id="orders-heading" className="text-xl font-bold">
          Your orders
        </h2>

        <div className="mt-5">
          {orders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="When you place an order it will show up here with live status."
              actionHref="/products"
              actionLabel="Start shopping"
            />
          ) : (
            <div className="overflow-x-auto rounded-md border border-line bg-surface">
              <table className="w-full min-w-[640px] text-left text-[14px]">
                <caption className="sr-only">
                  Your recent orders with status and totals
                </caption>
                <thead>
                  <tr className="border-b border-line bg-paper text-[12px] uppercase tracking-wider text-muted">
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Order
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orders.map((order: OrderRow) => (
                    <tr key={order.id} className="table-row-hover">
                      <td className="px-4 py-3.5 font-semibold">
                        <Link
                          href="/orders/lookup"
                          className="hover:text-accent hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-muted">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold">
                        {formatMoney(order.total_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Notice tone="info">
            Guest checkout orders (placed without signing in) are not listed
            here — use{" "}
            <Link href="/orders/lookup" className="font-semibold underline">
              Track an order
            </Link>{" "}
            with your order number and email.
          </Notice>
        </div>
      </section>
    </div>
  );
}
