import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { fieldErrorsFromZod } from "@/lib/orders/checkout";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/orders/lookup — guest order lookup by order number + email.
 * The pair acts as a shared knowledge factor; both must match exactly.
 * Rate limited; returns a minimal, non-enumerable shape on failure.
 */

const lookupSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .regex(/^HS-\d{5,10}$/i, "Order numbers look like HS-10001."),
  email: z.string().trim().email("Enter a valid email address.").max(254),
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error: "not-configured",
        message:
          "Supabase is not configured on the server. Order lookup is unavailable — see /setup.",
      },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      {
        error: "rate-limited",
        message: "Too many lookups. Please wait a minute and try again.",
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid-json", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation",
        message: "Please fix the highlighted fields.",
        fieldErrors: fieldErrorsFromZod(parsed.error),
      },
      { status: 422 },
    );
  }

  const orderNumber = parsed.data.orderNumber.toUpperCase();
  const email = parsed.data.email.toLowerCase();

  const { data: order, error } = await admin
    .from("orders")
    .select(
      `id, order_number, status, full_name, email, created_at,
       subtotal_cents, shipping_cents, total_cents,
       address_line1, address_line2, city, state, postal_code, country,
       order_items ( id, product_name, size, quantity, unit_price_cents )`,
    )
    .eq("order_number", orderNumber)
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "LOOKUP_FAILED", message: "Lookup failed. Please try again." },
      { status: 500 },
    );
  }

  if (!order) {
    // Same response for "unknown number" and "wrong email" — no enumeration.
    return NextResponse.json(
      {
        error: "not-found",
        message: "No order matches that order number and email combination.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ order }, { status: 200 });
}

export async function GET() {
  return NextResponse.json(
    { error: "method-not-allowed", message: "Use POST to look up an order." },
    { status: 405 },
  );
}

export const dynamic = "force-dynamic";
