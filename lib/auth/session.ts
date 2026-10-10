import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HeaderUser } from "@/components/layout/header";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
};

/**
 * Session-aware current user (deduped per request with React cache).
 * Returns `null` when signed out OR when Supabase is unconfigured.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const isAdmin = (roles ?? []).some((r) => r.role === "admin");
  const email = profile?.email ?? user.email ?? "";

  return {
    id: user.id,
    email,
    displayName: profile?.full_name?.trim() || email.split("@")[0] || "Customer",
    isAdmin,
  };
});

/** Narrow view consumed by the site header. */
export async function getHeaderUser(): Promise<HeaderUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    email: user.email,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
  };
}

/** Throws a redirect-friendly error object for admin-only server logic. */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AdminAuthError("unauthenticated");
  }
  if (!user.isAdmin) {
    throw new AdminAuthError("forbidden");
  }
  return user;
}

export class AdminAuthError extends Error {
  readonly reason: "unauthenticated" | "forbidden";
  constructor(reason: "unauthenticated" | "forbidden") {
    super(`Admin access denied: ${reason}`);
    this.name = "AdminAuthError";
    this.reason = reason;
  }
}
