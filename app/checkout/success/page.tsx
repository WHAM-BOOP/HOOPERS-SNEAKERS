"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { readLastOrder, type LastOrder } from "@/lib/orders/last-order";
import { formatMoney } from "@/lib/utils";

export default function CheckoutSuccessPage() {
  const [order, setOrder] = useState<LastOrder | null | undefined>(undefined);

  useEffect(() => {
    setOrder(readLastOrder());
  }, []);

  return (
    <div className="container-page py-14">
      {order === undefined ? (
        <div className="mx-auto max-w-lg space-y-4" role="status" aria-label="Loading order confirmation">
          <div className="skeleton h-10 w-2/3" />
          <div className="skeleton h-40 w-full" />
        </div>
      ) : order === null ? (
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold">Order placed</h1>
          <p className="mt-3 text-[15px] text-muted">
            We could not load the confirmation snapshot for this session (the
            page may have been opened directly). You can look up any order with
            its number and email.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/orders/lookup" variant="primary">
              Look up my order
            </Button>
            <Button href="/products" variant="outline">
              Continue shopping
            </Button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl">
          <div
            className={`rounded-md border px-6 py-8 text-center ${
              order.demo
                ? "border-warning/40 bg-warning-soft"
                : "border-success/30 bg-success-soft"
            }`}
          >
            <p className={`eyebrow ${order.demo ? "text-warning" : "text-success"}`}>
              {order.demo ? "Demo checkout complete" : "Order confirmed"}
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Thanks, {order.fullName.split(" ")[0] || order.fullName}!
            </h1>
            <p className={`mt-3 text-[15px] ${order.demo ? "text-warning" : "text-success"}`}>
              {order.demo ? (
                <>
                  This was a <strong>demo order</strong> ({order.orderNumber}) —
                  nothing was charged or saved. Connect Supabase to accept real
                  orders (see the{" "}
                  <Link href="/setup" className="font-semibold underline">
                    setup guide
                  </Link>
                  ).
                </>
              ) : (
                <>
                  Your order{" "}
                  <strong className="font-bold">{order.orderNumber}</strong> is in.
                  We will contact you at <strong>{order.email}</strong> to confirm
                  before delivery.
                </>
              )}
            </p>
          </div>

          <section
            aria-labelledby="summary-heading"
            className="mt-8 rounded-md border border-line bg-surface p-6"
          >
            <h2 id="summary-heading" className="text-lg font-bold">
              Order summary
            </h2>
            <ul className="mt-4 divide-y divide-line">
              {order.items.map((item, index) => (
                <li
                  key={`${item.name}-${item.size}-${index}`}
                  className="flex justify-between gap-4 py-3 text-[14.5px]"
                >
                  <span>
                    {item.name} · size {item.size} × {item.quantity}
                  </span>
                  <span className="font-semibold">
                    {formatMoney(item.unitPriceCents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[14.5px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatMoney(order.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd>
                  {order.shippingCents === 0
                    ? "Free"
                    : formatMoney(order.shippingCents)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-[16px] font-bold">
                <dt>Total due on delivery</dt>
                <dd>{formatMoney(order.totalCents)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-[13px] text-muted">
              Delivering to: {order.city}, {order.state}
            </p>
          </section>

          <section
            aria-labelledby="next-heading"
            className="mt-8 rounded-md border border-line bg-surface p-6"
          >
            <h2 id="next-heading" className="text-lg font-bold">
              {order.demo ? "How real orders work" : "What happens next"}
            </h2>
            <ol className="mt-4 space-y-3 text-[14.5px] text-muted">
              <li className="flex gap-3">
                <StepNumber n={1} />
                <span>We confirm stock and delivery details by phone or email.</span>
              </li>
              <li className="flex gap-3">
                <StepNumber n={2} />
                <span>Your pair is packed and shipped to your address.</span>
              </li>
              <li className="flex gap-3">
                <StepNumber n={3} />
                <span>
                  You pay the courier on delivery — cash or transfer.
                </span>
              </li>
            </ol>
          </section>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/products" variant="primary">
              Continue shopping
            </Button>
            <Button href="/orders/lookup" variant="outline">
              Save / track this order
            </Button>
          </div>
          <p className="mt-4 text-[13px] text-muted">
            Keep your order number <strong>{order.orderNumber}</strong> — you
            can check its status any time at{" "}
            <Link href="/orders/lookup" className="underline">
              Track an order
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-paper"
    >
      {n}
    </span>
  );
}
