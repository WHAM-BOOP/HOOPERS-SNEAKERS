import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { SetupHelpCard } from "@/components/ui/setup-help-card";
import { getCurrentUser } from "@/lib/auth/session";
import { getEnvStatus } from "@/lib/env";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Admin shell. Authorization happens on the server (and again in every server
 * action + RLS policy) — the UI gate is only a convenience layer.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const status = getEnvStatus();
  if (!status.supabaseReady) {
    return (
      <div className="container-page py-10">
        <SetupHelpCard />
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/sign-in?next=/admin");
  }
  if (!user.isAdmin) {
    redirect("/account");
  }

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Store administration</p>
          <h1 className="mt-1 text-2xl font-bold">Admin dashboard</h1>
        </div>
        <p className="text-[13px] text-muted">
          Signed in as <strong>{user.email}</strong>
        </p>
      </div>

      <AdminNav />

      <div className="mt-8">{children}</div>

      <p className="mt-10 text-[12px] text-muted">
        Need to promote another admin? Insert a row into{" "}
        <code className="rounded-xs bg-ink/5 px-1.5 py-0.5">user_roles</code>{" "}
        with <code className="rounded-xs bg-ink/5 px-1.5 py-0.5">role = 'admin'</code>{" "}
        in the Supabase SQL editor — see docs/SETUP.md.
      </p>
    </div>
  );
}
