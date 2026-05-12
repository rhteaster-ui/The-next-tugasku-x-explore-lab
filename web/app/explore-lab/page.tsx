import Link from "next/link";

export const metadata = { title: "Explore Lab · TugasKu" };

const CARDS = [
  {
    title: "Workspace Chat",
    desc: "Chat multi-model dengan auto-routing & web search.",
    href: "/explore-lab/chat",
  },
  {
    title: "Image Studio",
    desc: "Text-to-image + edit gambar via prompt.",
    href: "/explore-lab/image",
  },
  {
    title: "Tools",
    desc: "Web search, dokumen reader, dan prompt presets.",
    href: "/explore-lab/tools",
  },
];

export default function ExploreLabLanding() {
  return (
    <div className="space-y-10 py-12">
      <header className="space-y-3">
        <span className="badge border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
          Explore Lab · AI layer
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Eksperimen AI tanpa drama.
        </h1>
        <p className="max-w-prose text-pretty text-base text-ink-300 sm:text-lg">
          Chat, web search, dan image studio dalam satu tempat. Login untuk
          menyimpan riwayat AI dan sinkronisasi dengan TugasKu.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group card transition hover:border-cyan-400/30 hover:bg-white/[0.05]"
          >
            <h2 className="text-base font-semibold text-white">{c.title}</h2>
            <p className="mt-1 text-sm text-ink-300">{c.desc}</p>
            <span className="mt-3 inline-block text-xs text-cyan-300 transition group-hover:translate-x-0.5">
              Buka →
            </span>
          </Link>
        ))}
      </section>

      <section className="card">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
          Mode tamu
        </h2>
        <p className="mt-2 text-sm text-ink-300">
          Explore Lab bisa dipakai tanpa login untuk eksplorasi cepat. Login
          untuk menyimpan riwayat AI dan sinkronisasi dengan TugasKu.
        </p>
      </section>
    </div>
  );
}
