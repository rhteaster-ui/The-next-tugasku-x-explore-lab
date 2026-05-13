"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function DisplayNameForm({
  initial,
  email,
}: {
  initial: string;
  email: string;
}) {
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const id = userData.user?.id;
      if (!id) throw new Error("Sesi tidak ditemukan.");
      const { error: err } = await supabase
        .from("profiles")
        .upsert({ id, display_name: name.trim() || null });
      if (err) throw err;
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-xl space-y-4">
      <div className="space-y-1">
        <label className="text-sm text-ink-300" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="input opacity-60"
          value={email}
          readOnly
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-ink-300" htmlFor="display_name">
          Nama tampilan
        </label>
        <input
          id="display_name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mis. Sinta"
          maxLength={60}
        />
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={saving} type="submit">
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
        {savedAt && !saving && (
          <span className="text-xs text-brand-200">Tersimpan.</span>
        )}
        {error && <span className="text-xs text-rose-300">{error}</span>}
      </div>
    </form>
  );
}
