"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { cloudAdapter } from "@/lib/storage/cloud-adapter";
import { localAdapter } from "@/lib/storage/local-adapter";
import type { Task, TaskPriority } from "@/lib/supabase/types";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function TasksWorkspace() {
  const { isSignedIn, userId } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const adapter = isSignedIn ? cloudAdapter : localAdapter;
      const rows = await adapter.list("tasks");
      rows.sort(
        (a, b) =>
          new Date(b.updated_at ?? b.created_at).getTime() -
          new Date(a.updated_at ?? a.created_at).getTime(),
      );
      setTasks(rows);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const now = new Date().toISOString();
    const row: Task = {
      id: uid(),
      user_id: userId ?? "guest",
      title: title.trim(),
      description: null,
      status: "todo",
      priority,
      due_date: null,
      tags: [],
      source: "tugasku",
      google_calendar_event_id: null,
      created_at: now,
      updated_at: now,
    };
    const adapter = isSignedIn ? cloudAdapter : localAdapter;
    await adapter.upsert("tasks", row);
    setTitle("");
    setPriority("medium");
    await reload();
  }

  async function toggle(t: Task) {
    const updated: Task = {
      ...t,
      status: t.status === "done" ? "todo" : "done",
      updated_at: new Date().toISOString(),
    };
    const adapter = isSignedIn ? cloudAdapter : localAdapter;
    await adapter.upsert("tasks", updated);
    await reload();
  }

  async function remove(t: Task) {
    const adapter = isSignedIn ? cloudAdapter : localAdapter;
    await adapter.remove("tasks", t.id);
    await reload();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="card space-y-3">
        <label className="block text-sm text-ink-300" htmlFor="task-title">
          Tugas baru
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="task-title"
            className="input flex-1"
            placeholder="Mis. Selesaikan slide presentasi"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            className="input sm:max-w-[140px]"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            aria-label="Prioritas"
          >
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
          </select>
          <button className="btn-primary" type="submit">
            Tambah
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-ink-400">Memuat tugas…</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-ink-400">
          Belum ada tugas. Tambahkan satu untuk memulai.
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
            >
              <button
                type="button"
                onClick={() => toggle(t)}
                className={`grid h-5 w-5 place-items-center rounded-md border ${
                  t.status === "done"
                    ? "border-brand-400 bg-brand-500 text-white"
                    : "border-white/15 bg-transparent text-transparent"
                }`}
                aria-label="Toggle"
              >
                ✓
              </button>
              <div className="flex-1">
                <div
                  className={`text-sm ${
                    t.status === "done"
                      ? "text-ink-400 line-through"
                      : "text-white"
                  }`}
                >
                  {t.title}
                </div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
                  {t.priority}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(t)}
                className="text-xs text-rose-300 hover:underline"
              >
                Hapus
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
