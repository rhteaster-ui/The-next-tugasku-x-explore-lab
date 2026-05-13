import { NextResponse, type NextRequest } from "next/server";

import { decryptToken } from "@/lib/crypto";
import { isSupabaseConfigured } from "@/lib/env";
import { createEvent } from "@/lib/google/calendar";
import { createAdminClient, createClient } from "@/lib/supabase/server";

interface Body {
  taskId: string;
  summary: string;
  description?: string;
  startISO: string;
  endISO: string;
  reminderMinutes?: number;
}

function isValidIso(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
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

  if (
    !body.taskId ||
    !body.summary ||
    !isValidIso(body.startISO) ||
    !isValidIso(body.endISO)
  ) {
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

  let accessToken: string;
  let refreshToken: string | null = null;
  try {
    accessToken = decryptToken(connected.access_token_encrypted);
    if (connected.refresh_token_encrypted) {
      refreshToken = decryptToken(connected.refresh_token_encrypted);
    }
  } catch {
    return NextResponse.json({ error: "token_decrypt_failed" }, { status: 500 });
  }

  let result: Awaited<ReturnType<typeof createEvent>>;
  try {
    result = await createEvent(accessToken, refreshToken, {
      summary: body.summary,
      description: body.description,
      startISO: body.startISO,
      endISO: body.endISO,
      reminderMinutes: body.reminderMinutes,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "create_event_failed" },
      { status: 502 },
    );
  }

  await admin
    .from("tasks")
    .update({ google_calendar_event_id: result.id })
    .eq("user_id", user.id)
    .eq("id", body.taskId);

  return NextResponse.json({
    id: result.id,
    htmlLink: result.htmlLink,
  });
}
