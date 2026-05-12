import Link from "next/link";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { ResetOnboardingButton } from "@/components/account/ResetOnboardingButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  return (
    <div className="space-y-6 py-8">
      <header className="space-y-1">
        <span className="badge">Akun</span>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Akunmu di TugasKu
        </h1>
        <p className="text-ink-300">
          Kelola profil, sinkronisasi data, dan integrasi.
        </p>
      </header>

      <section className="card space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
          Profil
        </h2>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Email" value={user?.email ?? "—"} />
          <Field label="User ID" value={user?.id ?? "—"} mono />
          <Field
            label="Provider"
            value={user?.app_metadata?.provider ?? "email"}
          />
          <Field
            label="Sesi dibuat"
            value={
              user?.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString()
                : "—"
            }
          />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/settings/account" className="btn-ghost">
            Setelan akun
          </Link>
          <Link href="/settings/integrations" className="btn-ghost">
            Integrasi
          </Link>
          <ResetOnboardingButton />
          <LogoutButton />
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
          Privasi
        </h2>
        <p className="text-sm text-ink-300">
          Kami hanya menyimpan data yang kamu buat di TugasKu. Token Google
          disimpan terenkripsi (AES-256-GCM). Kamu bisa{" "}
          <Link href="/settings/integrations" className="link-subtle">
            memutus integrasi
          </Link>{" "}
          kapan saja.
        </p>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
        {label}
      </div>
      <div
        className={`mt-1 truncate ${mono ? "font-mono text-xs text-ink-300" : "text-white"}`}
      >
        {value}
      </div>
    </div>
  );
}
