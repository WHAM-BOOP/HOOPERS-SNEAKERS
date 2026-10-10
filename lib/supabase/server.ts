import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getEnvStatus } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Server Supabase client bound to the request cookies (session-aware RSC /
 * route-handler reads). `null` while unconfigured — callers must degrade.
 *
 * In Next.js 15 `cookies()` is async.
 */
export async function createSupabaseServerClient() {
  const status = getEnvStatus();
  if (!status.supabaseReady || !status.supabaseUrl) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(
    status.supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — session refresh still works
            // via middleware, which is the authoritative cookie writer.
          }
        },
      },
    },
  );
}
