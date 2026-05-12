/**
 * Storage abstraction shared between local-first (IndexedDB / localStorage)
 * and cloud (Supabase) adapters. The shape stays identical so the sync
 * manager can move data either direction without massaging it.
 */

import type {
  AiChat,
  AiMessage,
  FocusSession,
  ImageGeneration,
  Note,
  Task,
  UserSettings,
} from "@/lib/supabase/types";

export type RecordType =
  | "tasks"
  | "notes"
  | "focus_sessions"
  | "ai_chats"
  | "ai_messages"
  | "image_generations"
  | "user_settings";

export interface RecordMap {
  tasks: Task;
  notes: Note;
  focus_sessions: FocusSession;
  ai_chats: AiChat;
  ai_messages: AiMessage;
  image_generations: ImageGeneration;
  user_settings: UserSettings;
}

export type SyncStatus = "idle" | "saved_locally" | "syncing" | "synced" | "failed";

export interface StorageAdapter {
  /** Read everything for the local "guest" user or for the signed-in user. */
  list<T extends RecordType>(type: T): Promise<RecordMap[T][]>;
  get<T extends RecordType>(type: T, id: string): Promise<RecordMap[T] | null>;
  upsert<T extends RecordType>(type: T, value: RecordMap[T]): Promise<void>;
  remove<T extends RecordType>(type: T, id: string): Promise<void>;
  /** Wipe a single table (used by the migration dialog with user consent). */
  clear<T extends RecordType>(type: T): Promise<void>;
  /** Diagnostic counts — used to detect non-empty local data on login. */
  counts(): Promise<Record<RecordType, number>>;
}
