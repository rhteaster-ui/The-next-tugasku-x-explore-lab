import { NextResponse, type NextRequest } from "next/server";

import { decryptToken } from "@/lib/crypto";
import { isSupabaseConfigured } from "@/lib/env";
import { deleteEvent } from "@/lib/google/calendar";
import { createAdminClient, createClient } from "@/lib/supabase/server";

interface Body {
  eventId: string;
  taskId?: string;
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
  if (!body.eventId) {
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
    await deleteEvent(accessToken, refreshToken, body.eventId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "delete_event_failed" },
      { status: 502 },
    );
  }

  if (body.taskId) {
    await admin
      .from("tasks")
      .update({ google_calendar_event_id: null })
      .eq("user_id", user.id)
      .eq("id", body.taskId);
  }

  return NextResponse.json({ ok: true });
}
