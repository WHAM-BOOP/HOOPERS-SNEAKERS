"use client";

/**
 * Order confirmation snapshot saved after successful checkout so the
 * success page can render without re-querying. Display-only: the database
 * remains the source of truth (see /orders/lookup and /account).
 */

export type LastOrder = {
  orderNumber: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  fullName: string;
  email: string;
  city: string;
  state: string;
  items: { name: string; size: string; quantity: number; unitPriceCents: number }[];
  placedAt: string;
  /** True when created in demo mode (no Supabase) — not a real order. */
  demo?: boolean;
};

const KEY = "hoopers.last-order.v1";

export function saveLastOrder(order: LastOrder): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    // Session storage unavailable — the lookup page still finds the order.
  }
}

export function readLastOrder(): LastOrder | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const o = parsed as Partial<LastOrder>;
    if (typeof o.orderNumber !== "string" || typeof o.totalCents !== "number") {
      return null;
    }
    return {
      orderNumber: o.orderNumber,
      subtotalCents: o.subtotalCents ?? 0,
      shippingCents: o.shippingCents ?? 0,
      totalCents: o.totalCents ?? 0,
      fullName: o.fullName ?? "",
      email: o.email ?? "",
      city: o.city ?? "",
      state: o.state ?? "",
      items: Array.isArray(o.items) ? o.items : [],
      placedAt: o.placedAt ?? new Date().toISOString(),
      demo: o.demo === true,
    };
  } catch {
    return null;
  }
}
