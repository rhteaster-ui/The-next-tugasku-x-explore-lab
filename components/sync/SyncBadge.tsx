"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { onSyncStatus } from "@/lib/storage/sync-manager";
import type { SyncStatus } from "@/lib/storage/types";

const LABELS: Record<SyncStatus, string> = {
  idle: "Local only",
  saved_locally: "Saved locally",
  syncing: "Syncing…",
  synced: "Synced",
  failed: "Sync failed",
};

const COLORS: Record<SyncStatus, string> = {
  idle: "bg-white/[0.04] text-ink-300 border-white/10",
  saved_locally: "bg-amber-500/10 text-amber-200 border-amber-500/30",
  syncing: "bg-cyan-500/10 text-cyan-200 border-cyan-500/30",
  synced: "bg-brand-500/10 text-brand-200 border-brand-500/30",
  failed: "bg-rose-500/10 text-rose-200 border-rose-500/30",
};

export function SyncBadge() {
  const { isSignedIn } = useAuth();
  const [status, setStatus] = useState<SyncStatus>("idle");

  useEffect(() => onSyncStatus(setStatus), []);

  const effective: SyncStatus = isSignedIn
    ? status === "idle"
      ? "synced"
      : status
    : "idle";

  return (
    <span
      className={`badge border ${COLORS[effective]}`}
      title={
        isSignedIn
          ? "Status sinkronisasi data ke akunmu"
          : "Guest mode — data hanya tersimpan di perangkat ini"
      }
      data-testid="sync-badge"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          effective === "syncing"
            ? "animate-pulse bg-cyan-300"
            : effective === "synced"
              ? "bg-brand-300"
              : effective === "failed"
                ? "bg-rose-300"
                : "bg-ink-300"
        }`}
      />
      {LABELS[effective]}
    </span>
  );
}
