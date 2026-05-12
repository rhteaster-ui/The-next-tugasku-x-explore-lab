"use client";

import { cloudAdapter } from "./cloud-adapter";
import { hasLocalData, localAdapter } from "./local-adapter";
import type { RecordMap, RecordType, SyncStatus } from "./types";

/**
 * Sync manager — moves rows between the local-first adapter and the
 * cloud adapter. Strategy is intentionally conservative:
 *
 *   - "merge": cloud wins on conflict (updated_at newer). Local-only
 *     rows are pushed up.
 *   - "push_local": treat local as source of truth, overwrite cloud.
 *   - "pull_cloud": treat cloud as source of truth, replace local.
 *
 * The migration dialog asks the user which strategy to apply *the
 * first time* they sign in with non-empty local data.
 */

const SYNCABLE_TYPES: RecordType[] = [
  "tasks",
  "notes",
  "focus_sessions",
  "ai_chats",
  "ai_messages",
  "image_generations",
  "user_settings",
];

export type MergeStrategy = "merge" | "push_local" | "pull_cloud" | "keep_local";

type Listener = (status: SyncStatus, detail?: string) => void;
const listeners = new Set<Listener>();
let current: SyncStatus = "idle";

export function getSyncStatus(): SyncStatus {
  return current;
}

export function onSyncStatus(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
}

function emit(status: SyncStatus, detail?: string) {
  current = status;
  for (const l of listeners) l(status, detail);
}

function rowDate<T>(row: T): number {
  const r = row as { updated_at?: string; created_at?: string };
  const v = r.updated_at ?? r.created_at;
  return v ? new Date(v).getTime() : 0;
}

async function mergeType<T extends RecordType>(type: T): Promise<void> {
  const [localRows, cloudRows] = await Promise.all([
    localAdapter.list(type),
    cloudAdapter.list(type),
  ]);

  const byId = new Map<string, RecordMap[T]>();
  for (const row of cloudRows as RecordMap[T][]) {
    byId.set((row as { id: string }).id, row);
  }
  for (const row of localRows as RecordMap[T][]) {
    const id = (row as { id: string }).id;
    const cloud = byId.get(id);
    if (!cloud || rowDate(row) > rowDate(cloud)) {
      byId.set(id, row);
    }
  }

  // Push the merged set to cloud and refresh local mirror.
  for (const row of byId.values()) {
    await cloudAdapter.upsert(type, row);
    await localAdapter.upsert(type, row);
  }
}

async function pushLocalType<T extends RecordType>(type: T): Promise<void> {
  const rows = (await localAdapter.list(type)) as RecordMap[T][];
  await cloudAdapter.clear(type);
  for (const row of rows) {
    await cloudAdapter.upsert(type, row);
  }
}

async function pullCloudType<T extends RecordType>(type: T): Promise<void> {
  const rows = (await cloudAdapter.list(type)) as RecordMap[T][];
  await localAdapter.clear(type);
  for (const row of rows) {
    await localAdapter.upsert(type, row);
  }
}

export async function runSync(strategy: MergeStrategy): Promise<void> {
  if (strategy === "keep_local") {
    emit("saved_locally", "Sinkronisasi dilewati — data tetap di perangkat ini.");
    return;
  }

  emit("syncing");
  try {
    for (const type of SYNCABLE_TYPES) {
      if (strategy === "merge") await mergeType(type);
      else if (strategy === "push_local") await pushLocalType(type);
      else if (strategy === "pull_cloud") await pullCloudType(type);
    }
    emit("synced");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Gagal sinkronisasi data.";
    emit("failed", message);
    throw err;
  }
}

/** Decide whether to prompt the user with the migration dialog. */
export async function shouldOfferMigration(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const dismissed = window.localStorage.getItem(
    "tugasku.local.migration_offered",
  );
  if (dismissed === "1") return false;
  return hasLocalData();
}

export function markMigrationOffered() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("tugasku.local.migration_offered", "1");
}
