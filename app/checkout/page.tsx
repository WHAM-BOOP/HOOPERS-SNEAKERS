"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useCart } from "@/lib/cart/cart-context";
import {
  checkoutCustomerSchema,
  FREE_SHIPPING_THRESHOLD_CENTS,
  SHIPPING_FLAT_CENTS,
  fieldErrorsFromZod,
} from "@/lib/orders/checkout";
import { saveLastOrder } from "@/lib/orders/last-order";
import { getEnvStatus } from "@/lib/env";
import { formatMoney } from "@/lib/utils";

type FieldErrors = Record<string, string>;

const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "IE", label: "Ireland" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Germany" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "NL", label: "Netherlands" },
  { code: "AU", label: "Australia" },
  { code: "KE", label: "Kenya" },
  { code: "NG", label: "Nigeria" },
  { code: "ZA", label: "South Africa" },
  { code: "MA", label: "Morocco" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "IN", label: "India" },
  { code: "JP", label: "Japan" },
];

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  note: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalCents, hydrated, clearCart } = useCart();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const shippingCents =
    subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;
  const totalCents = subtotalCents + shippingCents;

  function set<K extends keyof typeof initialForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validated = checkoutCustomerSchema.safeParse(form);
    if (!validated.success) {
      setFieldErrors(fieldErrorsFromZod(validated.error));
      setFormError("Please fix the highlighted fields and try again.");
      return;
    }

    if (items.length === 0) {
      setFormError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    try {
      // Demo mode (Supabase unconfigured): simulate the confirmation locally
      // and say so — nothing is submitted or saved.
      const env = getEnvStatus();
      if (!env.supabaseReady) {
        const demoOrderNumber = `HS-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
        saveLastOrder({
          orderNumber: demoOrderNumber,
          subtotalCents,
          shippingCents,
          totalCents,
          fullName: validated.data.fullName,
          email: validated.data.email,
          city: validated.data.city,
          state: validated.data.state,
          items: items.map((item) => ({
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
          })),
          placedAt: new Date().toISOString(),
          demo: true,
        });
        clearCart();
        router.push("/checkout/success");
        return;
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: validated.data,
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity,
          })),
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        fieldErrors?: FieldErrors;
        order?: {
          orderNumber: string;
          subtotalCents: number;
          shippingCents: number;
          totalCents: number;
        };
      };

      if (!response.ok) {
        if (payload.fieldErrors) setFieldErrors(payload.fieldErrors);
        setFormError(
          payload.message ??
            "We could not place your order. Please try again.",
        );
        return;
      }

      const order = payload.order;
      if (!order) {
        setFormError("Unexpected server response. Please contact support.");
        return;
      }

      saveLastOrder({
        orderNumber: order.orderNumber,
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        totalCents: order.totalCents,
        fullName: validated.data.fullName,
        email: validated.data.email,
        city: validated.data.city,
        state: validated.data.state,
        items: items.map((item) => ({
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
        })),
        placedAt: new Date().toISOString(),
      });

      clearCart();
      router.push("/checkout/success");
    } catch {
      setFormError(
        "Network error — your order was not placed. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="container-page py-10">
        <div className="skeleton h-10 w-64" />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="skeleton h-96 w-full" />
          <div className="skeleton h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <header>
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Delivery details
        </h1>
        <p className="mt-2 text-[14.5px] text-muted">
          Pay on delivery — no card needed now. We will confirm your order by
          phone or email before shipping.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="mt-10 rounded-md border border-dashed border-line-strong px-6 py-16 text-center">
          <h2 className="text-xl font-bold">Nothing to check out</h2>
          <p className="mt-2 text-[14.5px] text-muted">
            Your cart is empty.
          </p>
          <Button href="/products" variant="primary" className="mt-6">
            Back to shopping
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            {formError ? (
              <Notice tone="danger" title="Could not place order">
                {formError}
              </Notice>
            ) : null}

            <fieldset disabled={submitting} className="space-y-5">
              <legend className="text-lg font-bold">Contact</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="fullName"
                  label="Full name"
                  value={form.fullName}
                  onChange={(v) => set("fullName", v)}
                  error={fieldErrors.fullName}
                  autoComplete="name"
                  required
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  error={fieldErrors.email}
                  autoComplete="email"
                  required
                />
                <Field
                  id="phone"
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => set("phone", v)}
                  error={fieldErrors.phone}
                  autoComplete="tel"
                  hint="We call to confirm before delivery."
                  required
                />
              </div>
            </fieldset>

            <fieldset disabled={submitting} className="space-y-5">
              <legend className="text-lg font-bold">Shipping address</legend>
              <div className="grid gap-5">
                <Field
                  id="addressLine1"
                  label="Street address"
                  value={form.addressLine1}
                  onChange={(v) => set("addressLine1", v)}
                  error={fieldErrors.addressLine1}
                  autoComplete="address-line1"
                  required
                />
                <Field
                  id="addressLine2"
                  label="Apartment, suite, etc. (optional)"
                  value={form.addressLine2}
                  onChange={(v) => set("addressLine2", v)}
                  error={fieldErrors.addressLine2}
                  autoComplete="address-line2"
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="city"
                    label="City"
                    value={form.city}
                    onChange={(v) => set("city", v)}
                    error={fieldErrors.city}
                    autoComplete="address-level2"
                    required
                  />
                  <Field
                    id="state"
                    label="State / region"
                    value={form.state}
                    onChange={(v) => set("state", v)}
                    error={fieldErrors.state}
                    autoComplete="address-level1"
                    required
                  />
                  <Field
                    id="postalCode"
                    label="ZIP / postal code"
                    value={form.postalCode}
                    onChange={(v) => set("postalCode", v)}
                    error={fieldErrors.postalCode}
                    autoComplete="postal-code"
                    required
                  />
                  <div>
                    <label htmlFor="country" className="label">
                      Country
                    </label>
                    <select
                      id="country"
                      className="input"
                      value={form.country}
                      onChange={(e) => set("country", e.target.value)}
                      autoComplete="country"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="note" className="label">
                    Delivery notes (optional)
                  </label>
                  <textarea
                    id="note"
                    rows={3}
                    className="input"
                    maxLength={1000}
                    value={form.note}
                    onChange={(e) => set("note", e.target.value)}
                    placeholder="Landmarks, gate codes, best delivery times…"
                  />
                  {fieldErrors.note ? (
                    <p className="field-error">{fieldErrors.note}</p>
                  ) : null}
                </div>
              </div>
            </fieldset>
          </div>

          <aside
            aria-label="Order summary"
            className="h-fit rounded-md border border-line bg-surface p-6"
          >
            <h2 className="text-lg font-bold">Your order</h2>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.size}`}
                  className="flex justify-between gap-3 text-[14px]"
                >
                  <span className="text-muted">
                    {item.name} · {item.size} × {item.quantity}
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatMoney(item.unitPriceCents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[14.5px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold">{formatMoney(subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="font-semibold">
                  {shippingCents === 0 ? "Free" : formatMoney(shippingCents)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-[16px]">
                <dt className="font-bold">Total (pay on delivery)</dt>
                <dd className="font-bold">{formatMoney(totalCents)}</dd>
              </div>
            </dl>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="mt-5 w-full"
              disabled={submitting}
            >
              {submitting ? "Placing order…" : "Place order"}
            </Button>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              By placing an order you agree to our{" "}
              <Link href="/terms" className="underline">
                terms of service
              </Link>
              . Prices are confirmed server-side before the order is created.
            </p>
          </aside>
        </form>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-danger">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <input
        id={id}
        type={type}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
          undefined
        }
      />
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
