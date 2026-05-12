import Link from "next/link";

import { GoogleCalendarPanel } from "@/components/integrations/GoogleCalendarPanel";
import { isGoogleCalendarConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let connected = false;
  let scope: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("connected_accounts")
      .select("scope, expires_at")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .maybeSingle();
    connected = Boolean(data);
    scope = data?.scope ?? null;
  }

  return (
    <div className="space-y-6 py-8">
      <header className="space-y-1">
        <span className="badge">Settings · Integrasi</span>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Integrasi pihak ketiga
        </h1>
        <p className="text-ink-300">
          Hubungkan layanan eksternal untuk fitur lanjutan TugasKu.
        </p>
      </header>

      <GoogleCalendarPanel
        configured={isGoogleCalendarConfigured()}
        connected={connected}
        scope={scope}
      />

      <section className="card">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
          Lainnya
        </h2>
        <p className="mt-2 text-sm text-ink-300">
          Integrasi tambahan (Notion, Slack, dst.) akan tersedia di rilis
          berikutnya. Lihat{" "}
          <Link href="/account" className="link-subtle">
            akun
          </Link>{" "}
          untuk preferensi privasi.
        </p>
      </section>
    </div>
  );
}
