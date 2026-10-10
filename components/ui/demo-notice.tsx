import Link from "next/link";

/**
 * Label shown wherever demo-catalog content appears while Supabase is not
 * configured. Keeps the demo honest: sample products, no real orders.
 */
export function DemoNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="status"
      className={`rounded-sm border border-warning/40 bg-warning-soft text-[12.5px] text-warning ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
    >
      <strong className="font-semibold">Demo mode.</strong> These are sample
      products — browsing and the cart work fully, but orders are not saved
      until the store is connected to Supabase.{" "}
      <Link href="/setup" className="font-semibold underline underline-offset-2">
        Setup guide
      </Link>
    </div>
  );
}
