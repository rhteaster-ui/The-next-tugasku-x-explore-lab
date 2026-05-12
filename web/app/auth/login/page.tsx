import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Masuk · TugasKu" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string; sent?: string };
}) {
  const configured = isSupabaseConfigured();
  return (
    <div className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
      <div className="space-y-4">
        <span className="badge border-brand-400/30 bg-brand-500/10 text-brand-200">
          Auth · TugasKu
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Masuk ke TugasKu.
        </h1>
        <p className="max-w-prose text-ink-300">
          Sinkronkan tugasmu di semua perangkat. Hubungkan akun untuk backup,
          kalender, dan AI history yang lebih aman.
        </p>
        <ul className="space-y-2 text-sm text-ink-300">
          <li>· Datamu tetap di perangkatmu sampai kamu memilih sinkron.</li>
          <li>· Tanpa login? Tetap bisa pakai TugasKu sebagai guest.</li>
          <li>· Google Calendar opsional — di-connect dari Settings.</li>
        </ul>
        <Link href="/tugasku/dashboard" className="btn-ghost">
          Lanjut tanpa login
        </Link>
      </div>

      <div className="card space-y-5">
        {!configured && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            Supabase belum dikonfigurasi. Salin{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5">
              .env.example
            </code>{" "}
            ke <code className="rounded bg-black/30 px-1.5 py-0.5">.env.local</code>{" "}
            dan isi <code>NEXT_PUBLIC_SUPABASE_URL</code> &{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </div>
        )}
        {searchParams.error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {decodeURIComponent(searchParams.error)}
          </div>
        )}
        {searchParams.sent === "1" && (
          <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 p-3 text-sm text-brand-200">
            Tautan masuk dikirim. Cek email kamu dan klik link untuk masuk.
          </div>
        )}
        <LoginForm next={searchParams.next ?? "/tugasku/dashboard"} />
      </div>
    </div>
  );
}
