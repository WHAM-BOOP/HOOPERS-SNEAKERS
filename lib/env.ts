/**
 * Environment detection.
 *
 * The app must never fabricate data when Supabase is not configured — it
 * degrades to an explicit "connect Supabase" state and points at /setup.
 *
 * Only NEXT_PUBLIC_* values are readable in browser code. The service-role
 * key stays server-side and is never imported into client modules.
 */

export type EnvStatus = {
  /** True when the minimum public Supabase config is present. */
  supabaseReady: boolean;
  /** Human names of missing required variables. */
  missing: string[];
  /** True when the server-side service-role key is also present. */
  serviceRoleReady: boolean;
  supabaseUrl: string | null;
};

const REQUIRED_PUBLIC = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

function readPublicEnv(): EnvStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!anon) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return {
    supabaseReady: missing.length === 0,
    missing,
    serviceRoleReady: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    supabaseUrl: url ? url : null,
  };
}

/** Safe to call from both server and client components. */
export function getEnvStatus(): EnvStatus {
  return readPublicEnv();
}

export { REQUIRED_PUBLIC };
