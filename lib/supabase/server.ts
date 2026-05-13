import { cookies } from "next/headers";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env";

/**
 * Server-side Supabase client bound to the current request's cookies.
 * Use this in Server Components, Server Actions, and Route Handlers
 * whenever you need the *user's* session.
 */
export function createClient() {
  const env = getServerEnv();
  const cookieStore = cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a Server Component — cookies are read-only there.
          // The Middleware refreshes the session, so this is safe to ignore.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // See note above.
        }
      },
    },
  });
}

/**
 * Privileged admin client (service role). Server-only. Bypasses RLS.
 * Use sparingly — only for system-level writes (e.g. token storage,
 * backfills, migrations).
 */
export function createAdminClient() {
  const env = getServerEnv();
  if (!env.supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin operations.",
    );
  }
  return createSupabaseJsClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
