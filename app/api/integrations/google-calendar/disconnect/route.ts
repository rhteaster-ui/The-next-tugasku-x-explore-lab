import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Auth backend belum dikonfigurasi." },
      { status: 503 },
    );
  }
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const admin = createAdminClient();
    await admin
      .from("connected_accounts")
      .delete()
      .eq("user_id", userData.user.id)
      .eq("provider", "google");
    await admin
      .from("user_settings")
      .upsert(
        { user_id: userData.user.id, calendar_sync_enabled: false },
        { onConflict: "user_id" },
      );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "disconnect_failed" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
