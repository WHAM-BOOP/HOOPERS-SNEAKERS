import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Hoopers Sneakers collects, uses, and protects your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="container-page py-12">
      <article className="mx-auto max-w-2xl">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-2 text-3xl font-bold">Privacy policy</h1>
        <p className="mt-3 text-[13px] text-muted">Last updated: October 10, 2026</p>

        <div className="prose-sm mt-8 space-y-8 text-[15px] leading-relaxed text-muted">
          <section>
            <h2 className="text-lg font-bold text-ink">What we collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-ink">Order information:</strong> name,
                email, phone, and delivery address — used only to confirm,
                ship, and support your order.
              </li>
              <li>
                <strong className="text-ink">Account information:</strong> email
                and name when you create an account (managed by Supabase Auth).
              </li>
              <li>
                <strong className="text-ink">Messages:</strong> content you send
                through the contact form.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">What we do not collect</h2>
            <p className="mt-3">
              We do not collect payment card data (orders are paid on
              delivery), and we do not sell personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Storage & security</h2>
            <p className="mt-3">
              Data is stored in Supabase (PostgreSQL) with Row Level Security
              enabled on all customer-facing tables. Access to admin functions
              is restricted to verified admin accounts and validated again on
              the server.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Your rights</h2>
            <p className="mt-3">
              You can request access, correction, or deletion of your personal
              data at any time through the{" "}
              <Link href="/contact" className="font-semibold text-accent underline">
                contact page
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Cookies</h2>
            <p className="mt-3">
              We use only essential cookies: session cookies for signed-in
              users (httpOnly, managed by Supabase) and local storage for your
              shopping cart. No advertising trackers.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
