import Link from "next/link";
import { getEnvStatus } from "@/lib/env";

/**
 * Shown wherever product data would appear while Supabase is unconfigured.
 * Honest state + the shortest path to fixing it. Never fake products.
 */
export function SetupHelpCard() {
  const status = getEnvStatus();

  return (
    <div className="rounded-md border border-dashed border-line-strong bg-surface px-6 py-12">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow text-warning">Waiting for Supabase</p>
        <h3 className="mt-3 text-xl font-bold">
          Connect the store database to see real products
        </h3>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
          This store does not ship with fake demo data. Add your Supabase
          project keys to <code className="rounded-xs bg-ink/5 px-1.5 py-0.5 text-[13px]">.env.local</code>,
          run the migrations in <code className="rounded-xs bg-ink/5 px-1.5 py-0.5 text-[13px]">supabase/migrations/</code>,
          and this area will load your live catalog.
        </p>
        {status.missing.length > 0 ? (
          <p className="mt-3 text-[13px] text-muted">
            Currently missing:{" "}
            <code className="rounded-xs bg-warning-soft px-1.5 py-0.5 text-warning">
              {status.missing.join(", ")}
            </code>
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/setup" className="btn-primary">
            Open the setup guide
          </Link>
          <Link href="/contact" className="btn-outline">
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
