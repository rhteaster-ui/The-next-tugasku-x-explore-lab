"use client";

import { useState } from "react";

export function ResetOnboardingButton() {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={() => {
        try {
          window.localStorage.removeItem("tugasku.onboarding_completed");
          window.sessionStorage.removeItem("tugasku.splash_shown_at");
          setDone(true);
          setTimeout(() => window.location.reload(), 350);
        } catch {
          // ignore
        }
      }}
    >
      {done ? "Memuat ulang…" : "Lihat lagi onboarding"}
    </button>
  );
}
