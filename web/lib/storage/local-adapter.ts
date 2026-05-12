"use client";

import { openDB, type IDBPDatabase } from "idb";

import type { RecordMap, RecordType, StorageAdapter } from "./types";

/**
 * IndexedDB-backed local-first storage. Each record type maps to one
 * object store keyed by `id`. The schema mirrors the cloud table shapes
 * so the sync manager can move rows in either direction without
 * reshaping them.
 *
 * Falls back to localStorage when IndexedDB is unavailable (e.g. SSR,
 * private mode) — this keeps guest mode working everywhere.
 */

const DB_NAME = "tugasku.local";
const DB_VERSION = 1;

const STORES: RecordType[] = [
  "tasks",
  "notes",
  "focus_sessions",
  "ai_chats",
  "ai_messages",
  "image_generations",
  "user_settings",
];

async function getDb(): Promise<IDBPDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return null;
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: "id" });
          }
        }
      },
    });
  } catch {
    return null;
  }
}

function lsKey(type: RecordType): string {
  return `tugasku.local.${type}`;
}

function lsList<T>(type: RecordType): T[] {
  try {
    const raw = window.localStorage.getItem(lsKey(type));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function lsSetAll<T>(type: RecordType, rows: T[]) {
  try {
    window.localStorage.setItem(lsKey(type), JSON.stringify(rows));
  } catch {
    // Quota exceeded or storage disabled — silently degrade.
  }
}

export const localAdapter: StorageAdapter = {
  async list<T extends RecordType>(type: T): Promise<RecordMap[T][]> {
    const db = await getDb();
    if (db) {
      return (await db.getAll(type)) as RecordMap[T][];
    }
    return lsList<RecordMap[T]>(type);
  },

  async get<T extends RecordType>(
    type: T,
    id: string,
  ): Promise<RecordMap[T] | null> {
    const db = await getDb();
    if (db) {
      const row = (await db.get(type, id)) as RecordMap[T] | undefined;
      return row ?? null;
    }
    const rows = lsList<RecordMap[T]>(type);
    return rows.find((r) => (r as { id: string }).id === id) ?? null;
  },

  async upsert<T extends RecordType>(
    type: T,
    value: RecordMap[T],
  ): Promise<void> {
    const db = await getDb();
    if (db) {
      await db.put(type, value);
      return;
    }
    const rows = lsList<RecordMap[T]>(type);
    const filtered = rows.filter(
      (r) => (r as { id: string }).id !== (value as { id: string }).id,
    );
    filtered.push(value);
    lsSetAll(type, filtered);
  },

  async remove<T extends RecordType>(type: T, id: string): Promise<void> {
    const db = await getDb();
    if (db) {
      await db.delete(type, id);
      return;
    }
    const rows = lsList<RecordMap[T]>(type).filter(
      (r) => (r as { id: string }).id !== id,
    );
    lsSetAll(type, rows);
  },

  async clear<T extends RecordType>(type: T): Promise<void> {
    const db = await getDb();
    if (db) {
      await db.clear(type);
      return;
    }
    window.localStorage.removeItem(lsKey(type));
  },

  async counts(): Promise<Record<RecordType, number>> {
    const db = await getDb();
    const result = {} as Record<RecordType, number>;
    for (const store of STORES) {
      if (db) {
        result[store] = await db.count(store);
      } else {
        result[store] = lsList(store).length;
      }
    }
    return result;
  },
};

/** True if the user has at least one row of any type stored locally. */
export async function hasLocalData(): Promise<boolean> {
  const counts = await localAdapter.counts();
  return Object.values(counts).some((n) => n > 0);
}
