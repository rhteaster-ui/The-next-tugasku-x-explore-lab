import { NextResponse } from "next/server";
import crypto from "node:crypto";

import {
  isGoogleCalendarConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import { buildAuthUrl } from "@/lib/google/calendar";
import { createClient } from "@/lib/supabase/server";

/**
 * Start the OAuth dance. We:
 *   1. Verify the caller is signed in.
 *   2. Generate a random `state` and stash it in an httpOnly cookie
 *      so the callback can verify it (CSRF guard).
 *   3. Return the Google consent URL for the client to redirect to.
 *
 * We deliberately return JSON instead of redirecting so the client can
 * present an opt-in modal/CTA before sending the user off-domain.
 */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Auth backend belum dikonfigurasi." },
      { status: 503 },
    );
  }
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google Calendar belum dikonfigurasi di server. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALENDAR_REDIRECT_URI.",
      },
      { status: 503 },
    );
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = crypto.randomBytes(24).toString("hex");
  const url = buildAuthUrl(state);

  const res = NextResponse.json({ url });
  res.cookies.set("gcal_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
