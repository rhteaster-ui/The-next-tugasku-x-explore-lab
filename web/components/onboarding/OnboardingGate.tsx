"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const SLIDES = [
  {
    title: "Selamat datang di TugasKu",
    body: "Workspace tugas, kalender, dan catatan yang cepat & ringan. Pakai langsung tanpa login.",
    image: "/onboarding/splash1.png",
  },
  {
    title: "AI ada di sisimu — Explore Lab",
    body: "Chat AI, web search, image studio. Hasilnya bisa langsung jadi tugas atau catatan di TugasKu.",
    image: "/onboarding/splash2.png",
  },
  {
    title: "Aman & sinkron kalau mau",
    body: "Masuk untuk sinkronisasi antar perangkat dan hubungkan Google Calendar untuk reminder. Tetap opt-in.",
    image: "/onboarding/splash3.png",
  },
] as const;

const KEY_ONBOARDING = "tugasku.onboarding_completed";
const KEY_SPLASH = "tugasku.splash_shown_at";

type Mode = "first_run_onboarding" | "splash" | "none";

function decideMode(): Mode {
  if (typeof window === "undefined") return "none";
  const completed = window.localStorage.getItem(KEY_ONBOARDING) === "1";
  if (!completed) return "first_run_onboarding";
  // After onboarding, show brief splash once per session.
  if (window.sessionStorage.getItem(KEY_SPLASH) === "1") return "none";
  return "splash";
}

export function OnboardingGate() {
  const [mode, setMode] = useState<Mode>("none");
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    setMode(decideMode());
  }, []);

  useEffect(() => {
    if (mode === "splash") {
      window.sessionStorage.setItem(KEY_SPLASH, "1");
      const t = setTimeout(() => setMode("none"), 1100);
      return () => clearTimeout(t);
    }
  }, [mode]);

  const current = useMemo(() => SLIDES[slide], [slide]);
  const isLast = slide === SLIDES.length - 1;

  function complete() {
    window.localStorage.setItem(KEY_ONBOARDING, "1");
    window.sessionStorage.setItem(KEY_SPLASH, "1");
    setMode("none");
  }

  if (mode === "none") return null;

  if (mode === "splash") {
    return (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-[#020611]/95 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Image
            src="/onboarding/splash1.png"
            alt="TugasKu"
            width={160}
            height={160}
            className="rounded-3xl shadow-glow"
            priority
          />
          <span className="text-sm font-medium uppercase tracking-[0.32em] text-brand-200">
            TugasKu
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-[#02060f]/90 p-4 backdrop-blur">
      <div className="card relative w-full max-w-md space-y-6 animate-fade-in">
        <button
          type="button"
          onClick={complete}
          className="absolute right-4 top-4 text-xs text-ink-300 underline-offset-4 hover:underline"
        >
          Lewati
        </button>
        <div className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
          <Image
            src={current.image}
            alt={current.title}
            width={640}
            height={420}
            className="h-48 w-full object-cover sm:h-56"
            priority
          />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold text-white">{current.title}</h2>
          <p className="text-sm text-ink-300">{current.body}</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          {SLIDES.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === slide ? "w-6 bg-brand-400" : "w-2 bg-white/15"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setSlide((s) => Math.max(0, s - 1))}
            disabled={slide === 0}
          >
            Kembali
          </button>
          {isLast ? (
            <button type="button" className="btn-primary" onClick={complete}>
              Mulai
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setSlide((s) => Math.min(SLIDES.length - 1, s + 1))}
            >
              Lanjut
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
