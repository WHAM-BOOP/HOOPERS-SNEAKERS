import { NextResponse, type NextRequest } from "next/server";
import {
  checkoutSchema,
  fieldErrorsFromZod,
  shippingCentsFor,
} from "@/lib/orders/checkout";
import { errorMessageFromDb } from "@/lib/orders/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/orders — place a pay-on-delivery order.
 *
 * Security invariants:
 * - Body shape validated with zod; prices/totals NEVER taken from the client.
 * - Stock is checked and decremented atomically inside the `place_order`
 *   Postgres function (single transaction).
 * - Writes use the service-role key (server only). Anonymous clients cannot
 *   insert orders directly — RLS has no insert policy for them.
 */

// Basic in-memory rate limit (per instance). A production multi-instance
// deployment should move this to a shared store — noted in docs/SETUP.md.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
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
          "Supabase is not configured on the server. Add environment variables (see /setup) before accepting orders.",
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
        message: "Too many order attempts. Please wait a minute and try again.",
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "invalid-json",
        message: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const parsed = checkoutSchema.safeParse(body);
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

  const { customer, items } = parsed.data;

  // Attach the order to the signed-in user when a session exists; guests
  // keep user_id = null and can look up their order with number + email.
  let userId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) userId = user.id;
    }
  } catch {
    // Session lookup failure must not block guest checkout.
  }

  try {
    const { data, error } = await admin.rpc("place_order", {
      p_customer: {
        full_name: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        address_line1: customer.addressLine1,
        address_line2: customer.addressLine2 ?? "",
        city: customer.city,
        state: customer.state,
        postal_code: customer.postalCode,
        country: customer.country,
        note: customer.note ?? "",
      },
      p_user_id: userId,
      p_items: items.map((item) => ({
        product_id: item.productId,
        size: item.size,
        quantity: item.quantity,
      })),
    });

    if (error) {
      const mapped = errorMessageFromDb(error.message);
      return NextResponse.json(
        { error: mapped.code, message: mapped.message },
        { status: mapped.status },
      );
    }

    const order = data as unknown as {
      id: string;
      order_number: string;
      subtotal_cents: number;
      shipping_cents: number;
      total_cents: number;
      status: string;
    };

    // Echo server-computed money so the client never trusts its own math.
    return NextResponse.json(
      {
        order: {
          id: order.id,
          orderNumber: order.order_number,
          subtotalCents: order.subtotal_cents,
          shippingCents: order.shipping_cents,
          totalCents: order.total_cents,
          shippingPolicy: {
            flatCents: shippingCentsFor(0),
          },
          status: order.status,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        error: "ORDER_FAILED",
        message: "We could not place your order. Please try again.",
      },
      { status: 500 },
    );
  }
}

/** Reject non-POST verbs explicitly (no silent 405 holes). */
export async function GET() {
  return NextResponse.json(
    { error: "method-not-allowed", message: "Use POST to place an order." },
    { status: 405 },
  );
}

export const dynamic = "force-dynamic";
