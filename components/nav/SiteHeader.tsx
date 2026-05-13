"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { SyncBadge } from "@/components/sync/SyncBadge";

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/explore-lab", label: "Explore Lab" },
  { href: "/tugasku/dashboard", label: "TugasKu" },
];

export function SiteHeader() {
  const { isSignedIn, email } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#050a14]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight text-white"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-cyan-400 text-[#04111d] shadow-glow">
            T
          </span>
          <span>
            TugasKu
            <span className="ml-1.5 text-xs font-medium uppercase tracking-[0.18em] text-brand-300/80">
              · Explore Lab
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-ink-300 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <SyncBadge />
          {isSignedIn ? (
            <Link
              href="/account"
              className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white transition hover:bg-white/[0.08] sm:flex"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-500/30 text-xs font-semibold uppercase text-brand-200">
                {(email ?? "U").charAt(0)}
              </span>
              <span className="max-w-[10rem] truncate">{email ?? "Akun"}</span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="btn-primary px-3 py-1.5"
              data-testid="login-cta"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
