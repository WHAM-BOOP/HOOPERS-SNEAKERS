import Link from "next/link";
import { getEnvStatus } from "@/lib/env";

/**
 * Persistent, dismissible-free banner shown while Supabase credentials are
 * missing. The app never fabricates data — it tells the operator exactly
 * what to do instead.
 */
export function SetupBanner() {
  const status = getEnvStatus();
  if (status.supabaseReady) return null;

  return (
    <div
      role="region"
      aria-label="Demo mode"
      className="border-b border-warning/40 bg-warning-soft"
    >
      <div className="container-page flex flex-col gap-2 py-2.5 text-[13px] text-warning sm:flex-row sm:items-center sm:justify-between">
        <p>
          <strong className="font-semibold">Demo mode.</strong> Sample catalog
          is showing — cart and checkout work, but orders are not saved until
          Supabase is connected ({" "}
          <code className="rounded-xs bg-warning/10 px-1 py-0.5 text-[12px]">
            {status.missing.join(", ")}
          </code>{" "}
          missing).
        </p>
        <Link
          href="/setup"
          className="shrink-0 font-semibold underline underline-offset-2 hover:no-underline"
        >
          Connect Supabase →
        </Link>
      </div>
    </div>
  );
}
