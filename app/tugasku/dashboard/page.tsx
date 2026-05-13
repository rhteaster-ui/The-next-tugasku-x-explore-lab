import Link from "next/link";

import { GuestBanner } from "@/components/dashboard/GuestBanner";
import { MigrationDialog } from "@/components/storage/MigrationDialog";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

const QUICK_LINKS = [
  { href: "/tugasku/tasks", title: "Tugas", desc: "Daftar tugas + due date." },
  { href: "/tugasku/calendar", title: "Kalender", desc: "Lihat jadwalmu." },
  { href: "/tugasku/focus", title: "Fokus", desc: "Sesi fokus + statistik." },
  { href: "/tugasku/notes", title: "Catatan", desc: "Catatan cepat & ide." },
  {
    href: "/tugasku/assistant",
    title: "Asisten AI",
    desc: "Bantu rangkum & buat tugas.",
  },
  {
    href: "/explore-lab",
    title: "Explore Lab",
    desc: "AI hub: chat, image, search.",
  },
];

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let displayName: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", userData.user.id)
          .maybeSingle();
        displayName = data?.display_name ?? userData.user.email ?? null;
      }
    } catch {
      // ignore — dashboard is auth-aware but can render for guests too.
    }
  }

  return (
    <div className="space-y-8 py-8">
      <MigrationDialog />
      <GuestBanner />

      <header className="space-y-1">
        <span className="badge">TugasKu · Dashboard</span>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          {displayName ? `Halo, ${displayName}.` : "Halo, selamat datang."}
        </h1>
        <p className="text-ink-300">
          Cepat akses tugas, jadwal, fokus, dan asisten AI-mu.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group card transition hover:border-brand-500/30 hover:bg-white/[0.05]"
          >
            <h2 className="text-base font-semibold text-white">{l.title}</h2>
            <p className="mt-1 text-sm text-ink-300">{l.desc}</p>
            <span className="mt-3 inline-block text-xs text-brand-300 transition group-hover:translate-x-0.5">
              Buka →
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
