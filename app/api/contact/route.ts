import { NextResponse, type NextRequest } from "next/server";
import { contactSchema, type ContactInput } from "@/lib/orders/contact";
import { fieldErrorsFromZod } from "@/lib/orders/checkout";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/contact — persist a contact message (service-role insert).
 * No anonymous insert policy exists on contact_messages.
 */

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
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
          "Supabase is not configured on the server. Messages cannot be delivered yet — see /setup.",
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
        message: "Too many messages. Please wait a minute and try again.",
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

  const parsed = contactSchema.safeParse(body);
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

  const input: ContactInput = parsed.data;
  const { error } = await admin.from("contact_messages").insert({
    name: input.name,
    email: input.email,
    phone: input.phone ? input.phone : null,
    subject: input.subject,
    message: input.message,
  });

  if (error) {
    return NextResponse.json(
      {
        error: "MESSAGE_FAILED",
        message: "We could not save your message. Please try again.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET() {
  return NextResponse.json(
    { error: "method-not-allowed", message: "Use POST to send a message." },
    { status: 405 },
  );
}

export const dynamic = "force-dynamic";
