/**
 * Lightweight Supabase types. A full generated Database type can be added
 * later via `supabase gen types typescript` once the project is linked.
 */

export type TaskStatus = "todo" | "in_progress" | "done" | "archived";
export type TaskPriority = "low" | "medium" | "high";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  tags: string[];
  source: string | null;
  google_calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  title: string | null;
  duration_minutes: number;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface AiChat {
  id: string;
  user_id: string;
  title: string | null;
  provider: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  chat_id: string;
  user_id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ImageGeneration {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string;
  provider: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: "system" | "light" | "dark";
  onboarding_completed: boolean;
  default_reminder_minutes: number;
  calendar_sync_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  provider: "google" | string;
  provider_account_id: string;
  scope: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}
