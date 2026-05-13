"use client";

import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";

/**
 * Browser-side Supabase client. Uses anon key only; never include the
 * service role key in client bundles.
 *
 * When Supabase isn't configured (e.g. local-only build), we return a
 * client built with empty strings — every call will fail with a clear
 * error rather than silently returning null data.
 */
export function createClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
