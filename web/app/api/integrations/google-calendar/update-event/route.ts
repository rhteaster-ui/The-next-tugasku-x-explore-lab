import { NextResponse, type NextRequest } from "next/server";

import { decryptToken } from "@/lib/crypto";
import { isSupabaseConfigured } from "@/lib/env";
import { updateEvent } from "@/lib/google/calendar";
import { createAdminClient, createClient } from "@/lib/supabase/server";

interface Body {
  eventId: string;
  summary: string;
  description?: string;
  startISO: string;
  endISO: string;
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Auth backend belum dikonfigurasi." },
      { status: 503 },
    );
  }
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.eventId || !body.summary) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: connected } = await admin
    .from("connected_accounts")
    .select("access_token_encrypted, refresh_token_encrypted")
    .eq("user_id", user.id)
    .eq("provider", "google")
    .maybeSingle();
  if (!connected?.access_token_encrypted) {
    return NextResponse.json({ error: "not_connected" }, { status: 412 });
  }

  try {
    const accessToken = decryptToken(connected.access_token_encrypted);
    const refreshToken = connected.refresh_token_encrypted
      ? decryptToken(connected.refresh_token_encrypted)
      : null;
    await updateEvent(accessToken, refreshToken, body.eventId, {
      summary: body.summary,
      description: body.description,
      startISO: body.startISO,
      endISO: body.endISO,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "update_event_failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
