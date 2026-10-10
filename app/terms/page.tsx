import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "Terms of using the Hoopers Sneakers store and placing orders.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="container-page py-12">
      <article className="mx-auto max-w-2xl">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-2 text-3xl font-bold">Terms of service</h1>
        <p className="mt-3 text-[13px] text-muted">Last updated: October 10, 2026</p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-muted">
          <section>
            <h2 className="text-lg font-bold text-ink">1. Placing orders</h2>
            <p className="mt-3">
              When you place an order on Hoopers Sneakers, you are making a
              request to purchase the listed items at the listed prices. All
              orders are <strong className="text-ink">pay on delivery</strong> —
              no payment is taken online. We confirm every order by phone or
              email before shipping.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">2. Pricing & availability</h2>
            <p className="mt-3">
              Prices are shown in US dollars and include no hidden fees.
              Shipping is a flat rate with free shipping above the advertised
              threshold. If an item becomes unavailable after ordering, we will
              offer a replacement or cancel the item at no cost to you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">3. Delivery & payment</h2>
            <p className="mt-3">
              Delivery windows are estimates, not guarantees. Payment is due in
              full to the courier at delivery (cash or transfer). Refusing a
              confirmed delivery may affect future orders.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">4. Returns</h2>
            <p className="mt-3">
              Unworn shoes in original packaging can be returned within 14 days
              of delivery. Contact us first to arrange a return. Worn or
              damaged items cannot be returned unless faulty.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">5. Accounts</h2>
            <p className="mt-3">
              You are responsible for keeping your account credentials secure.
              Guest checkout is available — account creation is optional.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">6. Contact</h2>
            <p className="mt-3">
              Questions about these terms?{" "}
              <Link href="/contact" className="font-semibold text-accent underline">
                Contact us
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
