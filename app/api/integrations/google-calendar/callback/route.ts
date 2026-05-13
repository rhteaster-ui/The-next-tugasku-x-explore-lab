import { NextResponse, type NextRequest } from "next/server";

import { encryptToken } from "@/lib/crypto";
import {
  isGoogleCalendarConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import { exchangeCodeForTokens } from "@/lib/google/calendar";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/**
 * OAuth callback for Google Calendar. We:
 *   - Validate `state` against the cookie we set in /connect.
 *   - Exchange `code` for tokens.
 *   - Persist tokens encrypted at rest (AES-256-GCM) keyed by user_id.
 *   - Redirect back to /settings/integrations with a status banner.
 *
 * NOTE: callback is in the middleware bypass list so it can be reached
 * without a Supabase session refresh round trip.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const cookieState = request.cookies.get("gcal_oauth_state")?.value;

  const redirectBase = new URL("/settings/integrations", url.origin);

  if (!isSupabaseConfigured() || !isGoogleCalendarConfigured()) {
    redirectBase.searchParams.set("error", "config");
    return NextResponse.redirect(redirectBase);
  }

  if (!code || !stateParam || !cookieState || cookieState !== stateParam) {
    redirectBase.searchParams.set("error", "state_mismatch");
    return NextResponse.redirect(redirectBase);
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    redirectBase.searchParams.set("error", "not_signed_in");
    return NextResponse.redirect(redirectBase);
  }

  let tokens: Awaited<ReturnType<typeof exchangeCodeForTokens>>;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch {
    redirectBase.searchParams.set("error", "token_exchange_failed");
    return NextResponse.redirect(redirectBase);
  }

  const accessToken = tokens.access_token ?? null;
  const refreshToken = tokens.refresh_token ?? null;
  if (!accessToken) {
    redirectBase.searchParams.set("error", "no_access_token");
    return NextResponse.redirect(redirectBase);
  }

  try {
    const admin = createAdminClient();
    const expiresAtIso = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : null;
    const row = {
      user_id: user.id,
      provider: "google",
      provider_account_id: user.id,
      scope: tokens.scope ?? null,
      access_token_encrypted: encryptToken(accessToken),
      refresh_token_encrypted: refreshToken
        ? encryptToken(refreshToken)
        : null,
      expires_at: expiresAtIso,
      updated_at: new Date().toISOString(),
    };
    await admin
      .from("connected_accounts")
      .upsert(row, { onConflict: "user_id,provider" });
    await admin
      .from("user_settings")
      .upsert(
        { user_id: user.id, calendar_sync_enabled: true },
        { onConflict: "user_id" },
      );
  } catch {
    redirectBase.searchParams.set("error", "store_tokens_failed");
    return NextResponse.redirect(redirectBase);
  }

  redirectBase.searchParams.set("connected", "1");
  const res = NextResponse.redirect(redirectBase);
  res.cookies.set("gcal_oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}
