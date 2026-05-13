import Link from "next/link";

import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

const HIGHLIGHTS = [
  {
    title: "Tugas + kalender + fokus",
    desc: "Satu workspace untuk daftar tugas, kalender, sesi fokus, dan catatan harian.",
  },
  {
    title: "AI Explore Lab",
    desc: "Chat multi-model, web search, image studio — terhubung ke TugasKu.",
  },
  {
    title: "Lokal dulu, sinkron belakangan",
    desc: "Bisa digunakan tanpa login. Jika masuk, datamu bisa disinkron antar perangkat.",
  },
  {
    title: "Google Calendar siap",
    desc: "Hubungkan akun Google untuk reminder dari deadline tugas — tetap opt-in.",
  },
];

export default function Page() {
  return (
    <>
      <OnboardingGate />
      <section className="grid items-center gap-10 py-12 md:grid-cols-[1.1fr_0.9fr] md:py-20">
        <div className="space-y-6">
          <span className="badge border-brand-400/30 bg-brand-500/10 text-brand-200">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            Versi baru · auth + cloud sync foundation
          </span>
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Tugasmu, jadwalmu, AI-mu —{" "}
            <span className="bg-gradient-to-r from-brand-300 to-cyan-300 bg-clip-text text-transparent">
              dalam satu workspace
            </span>
            .
          </h1>
          <p className="max-w-prose text-pretty text-base text-ink-300 sm:text-lg">
            TugasKu adalah AI productivity workspace yang local-first. Pakai
            tanpa login untuk catatan ringan, atau{" "}
            <span className="text-white">masuk untuk sinkronisasi</span>,
            backup, dan integrasi Google Calendar.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/auth/login" className="btn-primary">
              Masuk ke TugasKu
            </Link>
            <Link href="/tugasku/dashboard" className="btn-ghost">
              Lanjut tanpa login
            </Link>
          </div>
          <p className="text-xs text-ink-400">
            Tetap bisa digunakan offline. Tidak ada paksaan login.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-brand-500/20 via-cyan-500/10 to-transparent blur-2xl" />
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <span className="badge">TugasKu · Dashboard</span>
              <span className="badge border-brand-400/30 bg-brand-500/10 text-brand-200">
                Synced
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <span>Selesaikan deck UAS</span>
                <span className="text-xs text-amber-200">Senin</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <span>Riset literatur AI</span>
                <span className="text-xs text-brand-200">Hari ini</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <span>Catatan Explore Lab chat</span>
                <span className="text-xs text-ink-400">Tersimpan</span>
              </div>
            </div>
            <p className="text-xs text-ink-400">
              Preview UI — datamu tetap aman di perangkatmu sampai kamu
              memilih untuk sinkron.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {HIGHLIGHTS.map((h) => (
          <div key={h.title} className="card">
            <h3 className="text-sm font-semibold text-white">{h.title}</h3>
            <p className="mt-2 text-sm text-ink-300">{h.desc}</p>
          </div>
        ))}
      </section>
    </>
  );
}
