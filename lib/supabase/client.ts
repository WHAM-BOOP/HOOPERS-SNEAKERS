"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getEnvStatus } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Browser Supabase client. Returns `null` while credentials are missing so
 * pages can render the /setup guidance instead of throwing or faking data.
 */
export function createSupabaseBrowserClient() {
  const status = getEnvStatus();
  if (!status.supabaseReady || !status.supabaseUrl) return null;

  return createBrowserClient<Database>(
    status.supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  );
}
