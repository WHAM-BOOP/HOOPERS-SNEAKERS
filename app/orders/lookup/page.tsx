"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { formatDate, formatMoney } from "@/lib/utils";

type LookupOrder = {
  order_number: string;
  status: string;
  full_name: string;
  created_at: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  order_items: {
    id: string;
    product_name: string;
    size: string;
    quantity: number;
    unit_price_cents: number;
  }[];
};

const STATUS_TONE: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  pending: "warning",
  confirmed: "accent",
  processing: "accent",
  shipped: "accent",
  delivered: "success",
  cancelled: "danger",
};

export default function OrderLookupPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<LookupOrder | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setOrder(null);
    setLoading(true);

    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const payload = (await response.json()) as {
        message?: string;
        fieldErrors?: Record<string, string>;
        order?: LookupOrder;
      };

      if (!response.ok) {
        if (payload.fieldErrors) setFieldErrors(payload.fieldErrors);
        setError(payload.message ?? "Lookup failed. Please try again.");
        return;
      }
      setOrder(payload.order ?? null);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-xl">
        <header className="text-center">
          <p className="eyebrow">Order status</p>
          <h1 className="mt-2 text-3xl font-bold">Track an order</h1>
          <p className="mt-3 text-[15px] text-muted">
            Enter the order number from your confirmation (e.g.{" "}
            <code className="rounded-xs bg-ink/5 px-1.5 py-0.5">HS-10001</code>)
            and the email you ordered with.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 rounded-md border border-line bg-surface p-6"
        >
          {error ? (
            <div className="mb-5">
              <Notice tone="danger" title="Lookup failed">
                {error}
              </Notice>
            </div>
          ) : null}

          <div className="space-y-5">
            <div>
              <label htmlFor="orderNumber" className="label">
                Order number
              </label>
              <input
                id="orderNumber"
                className="input"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="HS-10001"
                autoComplete="off"
                required
                aria-invalid={fieldErrors.orderNumber ? true : undefined}
                aria-describedby={fieldErrors.orderNumber ? "orderNumber-error" : undefined}
              />
              {fieldErrors.orderNumber ? (
                <p id="orderNumber-error" className="field-error">
                  {fieldErrors.orderNumber}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="lookup-email" className="label">
                Email used for the order
              </label>
              <input
                id="lookup-email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={fieldErrors.email ? "lookup-email-error" : undefined}
              />
              {fieldErrors.email ? (
                <p id="lookup-email-error" className="field-error">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="mt-6 w-full"
            disabled={loading}
          >
            {loading ? "Searching…" : "Find my order"}
          </Button>
        </form>

        {order ? (
          <section
            aria-labelledby="order-heading"
            className="mt-8 rounded-md border border-line bg-surface p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Order</p>
                <h2 id="order-heading" className="mt-1 text-xl font-bold">
                  {order.order_number}
                </h2>
                <p className="mt-1 text-[13px] text-muted">
                  Placed {formatDate(order.created_at)} · {order.full_name}
                </p>
              </div>
              <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>
                {order.status}
              </Badge>
            </div>

            <ul className="mt-5 divide-y divide-line border-t border-line">
              {order.order_items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between gap-4 py-3 text-[14.5px]"
                >
                  <span>
                    {item.product_name} · size {item.size} × {item.quantity}
                  </span>
                  <span className="font-semibold">
                    {formatMoney(item.unit_price_cents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 text-[14.5px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatMoney(order.subtotal_cents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd>
                  {order.shipping_cents === 0
                    ? "Free"
                    : formatMoney(order.shipping_cents)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-[16px] font-bold">
                <dt>Total due on delivery</dt>
                <dd>{formatMoney(order.total_cents)}</dd>
              </div>
            </dl>

            <p className="mt-4 text-[13px] text-muted">
              Delivering to: {order.address_line1}
              {order.address_line2 ? `, ${order.address_line2}` : ""},{" "}
              {order.city}, {order.state} {order.postal_code}, {order.country}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
