"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { localAdapter } from "@/lib/storage/local-adapter";
import {
  markMigrationOffered,
  runSync,
  shouldOfferMigration,
  type MergeStrategy,
} from "@/lib/storage/sync-manager";
import type { RecordType } from "@/lib/storage/types";

type CountMap = Record<RecordType, number>;

const LABELS: Record<RecordType, string> = {
  tasks: "Tugas",
  notes: "Catatan",
  focus_sessions: "Sesi fokus",
  ai_chats: "Chat AI",
  ai_messages: "Pesan AI",
  image_generations: "Hasil image AI",
  user_settings: "Setelan",
};

export function MigrationDialog() {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<CountMap | null>(null);
  const [busy, setBusy] = useState<MergeStrategy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isSignedIn) return;
      const should = await shouldOfferMigration();
      if (!should || !mounted) return;
      const c = (await localAdapter.counts()) as CountMap;
      if (!mounted) return;
      setCounts(c);
      setOpen(true);
    })();
    return () => {
      mounted = false;
    };
  }, [isSignedIn]);

  if (!open || !counts) return null;

  async function decide(strategy: MergeStrategy) {
    setBusy(strategy);
    setError(null);
    try {
      await runSync(strategy);
      markMigrationOffered();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal sinkronisasi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[55] grid place-items-center bg-[#02060f]/85 p-4 backdrop-blur">
      <div className="card w-full max-w-lg space-y-5 animate-fade-in">
        <header className="space-y-1">
          <span className="badge border-brand-500/30 bg-brand-500/10 text-brand-200">
            Selamat datang kembali
          </span>
          <h2 className="text-lg font-semibold text-white">
            Kami menemukan data di perangkat ini
          </h2>
          <p className="text-sm text-ink-300">
            Mau diapakan data lokalmu? Kami tidak akan menimpa apa pun tanpa
            izinmu.
          </p>
        </header>

        <ul className="grid grid-cols-2 gap-2 text-xs text-ink-300">
          {(Object.keys(counts) as RecordType[])
            .filter((k) => counts[k] > 0)
            .map((k) => (
              <li
                key={k}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1.5"
              >
                <span>{LABELS[k]}</span>
                <span className="font-mono text-white">{counts[k]}</span>
              </li>
            ))}
        </ul>

        <div className="space-y-2">
          <button
            type="button"
            className="btn-primary w-full"
            disabled={busy !== null}
            onClick={() => decide("merge")}
          >
            {busy === "merge"
              ? "Menggabungkan…"
              : "Gabungkan dengan data cloud (rekomendasi)"}
          </button>
          <button
            type="button"
            className="btn-ghost w-full"
            disabled={busy !== null}
            onClick={() => decide("push_local")}
          >
            {busy === "push_local"
              ? "Mengunggah…"
              : "Sinkronkan data lokal ke akun"}
          </button>
          <button
            type="button"
            className="btn-ghost w-full"
            disabled={busy !== null}
            onClick={() => decide("keep_local")}
          >
            Simpan lokal saja untuk sekarang
          </button>
        </div>

        {error && <p className="text-xs text-rose-300">{error}</p>}
        <p className="text-[11px] text-ink-400">
          Kamu bisa mengubah preferensi sinkronisasi kapan saja di Setelan.
        </p>
      </div>
    </div>
  );
}
