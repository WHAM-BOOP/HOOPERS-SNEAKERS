import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getEnvStatus } from "@/lib/env";

export const metadata: Metadata = {
  title: "Store setup status",
  description:
    "Live connection status for the Hoopers Sneakers store database and step-by-step Supabase setup instructions.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function SetupPage() {
  const status = getEnvStatus();

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <header>
          <p className="eyebrow">Operations</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Store setup status
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            This page reports the live configuration state of the store. The
            site never fabricates product data — if a service is not connected,
            it says so.
          </p>
        </header>

        <section
          aria-labelledby="status-heading"
          className="mt-8 rounded-md border border-line bg-surface p-6"
        >
          <h2 id="status-heading" className="text-lg font-bold">
            Connection status
          </h2>
          <dl className="mt-4 space-y-3 text-[14.5px]">
            <StatusRow
              label="Supabase (database, auth, storage)"
              ok={status.supabaseReady}
              detail={
                status.supabaseReady
                  ? "Configured — catalog, orders, and auth are live."
                  : `Missing: ${status.missing.join(", ")}. Catalog and checkout are disabled until these are set.`
              }
            />
            <StatusRow
              label="Service-role key (server order writes)"
              ok={status.serviceRoleReady}
              detail={
                status.serviceRoleReady
                  ? "Present on the server — orders and contact messages can be saved."
                  : "SUPABASE_SERVICE_ROLE_KEY is not set. Order placement and contact form will return 503 until it is."
              }
            />
          </dl>
        </section>

        <section aria-labelledby="steps-heading" className="mt-10">
          <h2 id="steps-heading" className="text-xl font-bold">
            Setup in 6 steps
          </h2>
          <ol className="mt-5 space-y-6">
            <Step n={1} title="Create a Supabase project">
              <p>
                Go to{" "}
                <a
                  href="https://supabase.com/dashboard"
                  className="font-semibold text-accent hover:underline"
                >
                  supabase.com/dashboard
                </a>
                , create a project, and wait for provisioning to finish.
              </p>
            </Step>
            <Step n={2} title="Run the database migrations">
              <p>
                In the Supabase SQL editor, run the files in{" "}
                <code className="rounded-xs bg-ink/5 px-1.5 py-0.5">
                  supabase/migrations/
                </code>{" "}
                in order (0001 → 0004). Optionally run{" "}
                <code className="rounded-xs bg-ink/5 px-1.5 py-0.5">
                  supabase/seed.sql
                </code>{" "}
                for starter categories.
              </p>
            </Step>
            <Step n={3} title="Copy your API keys">
              <p>
                Project Settings → API. Copy the <strong>Project URL</strong>,{" "}
                <strong>anon public</strong> key, and{" "}
                <strong>service_role</strong> key.
              </p>
            </Step>
            <Step n={4} title="Set environment variables">
              <p>
                Create{" "}
                <code className="rounded-xs bg-ink/5 px-1.5 py-0.5">.env.local</code>{" "}
                from{" "}
                <code className="rounded-xs bg-ink/5 px-1.5 py-0.5">.env.example</code>{" "}
                for local development. On Vercel, add the same keys in Project →
                Settings → Environment Variables. Never commit real keys.
              </p>
            </Step>
            <Step n={5} title="Create your admin account">
              <p>
                Sign up on the site, then in the Supabase SQL editor run:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-sm bg-ink px-4 py-3 text-[12.5px] text-paper">
{`insert into public.user_roles (user_id, role)
values ('YOUR-USER-ID', 'admin');`}
              </pre>
              <p className="mt-2">
                (Find your user id in Authentication → Users.)
              </p>
            </Step>
            <Step n={6} title="Add products and go live">
              <p>
                Open{" "}
                <Link href="/admin/products" className="font-semibold text-accent hover:underline">
                  /admin/products
                </Link>
                , create your catalog (images can be uploaded straight to
                Supabase Storage), then deploy to Vercel. See{" "}
                <code className="rounded-xs bg-ink/5 px-1.5 py-0.5">
                  docs/SETUP.md
                </code>{" "}
                for the full deployment checklist and RLS test script.
              </p>
            </Step>
          </ol>
        </section>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-sm border border-line px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div>
        <dt className="font-semibold text-ink">{label}</dt>
        <dd className="mt-0.5 text-[13px] text-muted">{detail}</dd>
      </div>
      <Badge tone={ok ? "success" : "warning"}>{ok ? "Connected" : "Not set"}</Badge>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-paper"
      >
        {n}
      </span>
      <div>
        <h3 className="font-bold">{title}</h3>
        <div className="mt-1.5 text-[14.5px] leading-relaxed text-muted">
          {children}
        </div>
      </div>
    </li>
  );
}
