"use client";

import { useEffect, useState } from "react";

import { onSyncStatus } from "@/lib/storage/sync-manager";
import type { SyncStatus } from "@/lib/storage/types";

export function SyncStatusToast() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [detail, setDetail] = useState<string | undefined>();
  const [open, setOpen] = useState(false);

  useEffect(
    () =>
      onSyncStatus((s, d) => {
        setStatus(s);
        setDetail(d);
        if (s === "syncing" || s === "synced" || s === "failed") {
          setOpen(true);
          if (s !== "syncing") {
            const t = setTimeout(() => setOpen(false), 3200);
            return () => clearTimeout(t);
          }
        }
      }),
    [],
  );

  if (!open || status === "idle") return null;

  const tone =
    status === "failed"
      ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
      : status === "syncing"
        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100"
        : "border-brand-500/40 bg-brand-500/10 text-brand-100";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto inline-flex items-center gap-3 rounded-xl border px-4 py-2 text-sm shadow-soft backdrop-blur ${tone}`}
      >
        <span>
          {status === "syncing"
            ? "Menyinkronkan data ke akunmu…"
            : status === "synced"
              ? "Data tersinkron ke akunmu."
              : detail ?? "Gagal menyinkronkan data."}
        </span>
        {status !== "syncing" && (
          <button
            type="button"
            className="text-xs underline-offset-4 hover:underline"
            onClick={() => setOpen(false)}
          >
            Tutup
          </button>
        )}
      </div>
    </div>
  );
}
