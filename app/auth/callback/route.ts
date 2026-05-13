import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / magic link callback. Supabase redirects here with either:
 *   - `code` (PKCE flow): exchange for a session.
 *   - `error_description` / `error`: surface a friendly message.
 *
 * On success we redirect to `next` (defaults to /tugasku/dashboard).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next") ?? "/tugasku/dashboard";
  const next = nextRaw.startsWith("/") ? nextRaw : "/tugasku/dashboard";

  const errorDescription =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (errorDescription) {
    const redirect = new URL("/auth/login", url.origin);
    redirect.searchParams.set("error", errorDescription);
    return NextResponse.redirect(redirect);
  }

  if (!code) {
    const redirect = new URL("/auth/login", url.origin);
    redirect.searchParams.set("error", "Sesi tidak valid. Coba masuk ulang.");
    return NextResponse.redirect(redirect);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const redirect = new URL("/auth/login", url.origin);
    redirect.searchParams.set("error", error.message);
    return NextResponse.redirect(redirect);
  }

  const dest = new URL(next, url.origin);
  return NextResponse.redirect(dest);
}
