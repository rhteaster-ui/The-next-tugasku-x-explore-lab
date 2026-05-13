"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";

export function GuestBanner() {
  const { isSignedIn } = useAuth();
  if (isSignedIn) return null;
  return (
    <aside className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-100">
      <p>
        <span className="font-medium">Guest mode aktif.</span> Datamu tersimpan
        di perangkat ini saja — belum disinkron.
      </p>
      <Link href="/auth/login" className="btn-primary px-3 py-1.5">
        Masuk untuk sinkronisasi
      </Link>
    </aside>
  );
}
