"use client";

import { useState } from "react";

interface Props {
  configured: boolean;
  connected: boolean;
  scope: string | null;
}

export function GoogleCalendarPanel({ configured, connected, scope }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/google-calendar/connect", {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memulai koneksi.");
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!confirm("Putuskan koneksi Google Calendar?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/google-calendar/disconnect", {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memutus integrasi.");
      setBusy(false);
    }
  }

  return (
    <section className="card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">
            Google Calendar
          </h2>
          <p className="mt-1 max-w-prose text-sm text-ink-300">
            Gunakan Google Calendar untuk reminder yang tetap aktif meskipun
            web app tidak sedang dibuka. TugasKu akan membuat event kalender
            dari deadline tugasmu.
          </p>
        </div>
        <span
          className={`badge ${
            connected
              ? "border-brand-500/40 bg-brand-500/10 text-brand-200"
              : "border-white/10"
          }`}
        >
          {connected ? "Terhubung" : "Tidak terhubung"}
        </span>
      </div>

      {!configured && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Integrasi belum dikonfigurasi server. Set{" "}
          <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>, dan{" "}
          <code>GOOGLE_CALENDAR_REDIRECT_URI</code> di environment.
        </div>
      )}

      {scope && (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-ink-300">
          Scope diberikan:{" "}
          <code className="text-ink-200">{scope}</code>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {connected ? (
          <button
            type="button"
            onClick={disconnect}
            disabled={busy}
            className="btn-ghost"
          >
            {busy ? "Memproses…" : "Disconnect Google Calendar"}
          </button>
        ) : (
          <button
            type="button"
            onClick={connect}
            disabled={busy || !configured}
            className="btn-primary"
          >
            {busy ? "Membuka Google…" : "Connect Google Calendar"}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-rose-300">{error}</p>}
    </section>
  );
}
