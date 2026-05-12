"use client";

import { createClient } from "@/lib/supabase/client";

import type { RecordMap, RecordType, StorageAdapter } from "./types";

/**
 * Supabase-backed cloud storage. Each record type maps directly to a
 * table; RLS makes sure callers only see rows where user_id matches
 * auth.uid().
 */
function tableFor(type: RecordType): string {
  return type;
}

export const cloudAdapter: StorageAdapter = {
  async list<T extends RecordType>(type: T): Promise<RecordMap[T][]> {
    const supabase = createClient();
    const { data, error } = await supabase.from(tableFor(type)).select("*");
    if (error) throw error;
    return (data ?? []) as RecordMap[T][];
  },

  async get<T extends RecordType>(
    type: T,
    id: string,
  ): Promise<RecordMap[T] | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(tableFor(type))
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as RecordMap[T] | null) ?? null;
  },

  async upsert<T extends RecordType>(
    type: T,
    value: RecordMap[T],
  ): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from(tableFor(type))
      .upsert(value as unknown as Record<string, unknown>);
    if (error) throw error;
  },

  async remove<T extends RecordType>(type: T, id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from(tableFor(type)).delete().eq("id", id);
    if (error) throw error;
  },

  async clear<T extends RecordType>(type: T): Promise<void> {
    const supabase = createClient();
    // Delete all rows the current user can see (RLS scopes to user_id).
    const { error } = await supabase.from(tableFor(type)).delete().neq("id", "");
    if (error) throw error;
  },

  async counts(): Promise<Record<RecordType, number>> {
    const supabase = createClient();
    const types: RecordType[] = [
      "tasks",
      "notes",
      "focus_sessions",
      "ai_chats",
      "ai_messages",
      "image_generations",
      "user_settings",
    ];
    const result = {} as Record<RecordType, number>;
    for (const type of types) {
      const { count, error } = await supabase
        .from(tableFor(type))
        .select("*", { count: "exact", head: true });
      if (error) {
        result[type] = 0;
      } else {
        result[type] = count ?? 0;
      }
    }
    return result;
  },
};
