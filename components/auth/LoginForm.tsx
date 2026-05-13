"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

interface Props {
  next: string;
}

export function LoginForm({ next }: Props) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const callbackUrl = `${publicEnv.appUrl}/auth/callback?next=${encodeURIComponent(next)}`;

  async function signInWithGoogle() {
    if (!isSupabaseConfigured()) {
      setError("Supabase belum dikonfigurasi.");
      return;
    }
    setError(null);
    setBusy("google");
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl },
      });
      if (err) throw err;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal masuk dengan Google.");
      setBusy(null);
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("Supabase belum dikonfigurasi.");
      return;
    }
    if (!email.trim()) return;
    setError(null);
    setBusy("email");
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: callbackUrl, shouldCreateUser: true },
      });
      if (err) throw err;
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengirim tautan.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={busy !== null}
        className="btn-primary w-full"
        data-testid="login-google"
      >
        <GoogleMark />
        {busy === "google" ? "Membuka Google…" : "Lanjut dengan Google"}
      </button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-ink-400">
        <span className="h-px flex-1 bg-white/10" />
        atau
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <label className="block text-sm text-ink-300">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="kamu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input mt-1"
            data-testid="login-email"
          />
        </label>
        <button
          type="submit"
          disabled={busy !== null}
          className="btn-ghost w-full"
          data-testid="login-magic-link"
        >
          {busy === "email"
            ? "Mengirim tautan…"
            : sent
              ? "Tautan terkirim — cek emailmu"
              : "Kirim tautan masuk"}
        </button>
      </form>

      {error && (
        <p className="text-xs text-rose-300" data-testid="login-error">
          {error}
        </p>
      )}

      <p className="text-xs text-ink-400">
        Dengan masuk kamu menyetujui privasi & ketentuan TugasKu. Kami tidak
        mengakses Google Calendar kecuali kamu mengaktifkannya di Settings.
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.2 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.2 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.3l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.2 5.2C40.1 35.7 44 30.4 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
