import type { Metadata, Viewport } from "next";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { SyncStatusToast } from "@/components/sync/SyncStatusToast";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

import "./globals.css";

export const metadata: Metadata = {
  title: "TugasKu — AI-powered productivity workspace",
  description:
    "TugasKu adalah AI productivity workspace dengan local-first storage, cloud sync opsional, dan integrasi Google Calendar. Explore Lab adalah AI layer-nya.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialUserId: string | null = null;
  let initialEmail: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      initialUserId = data.user?.id ?? null;
      initialEmail = data.user?.email ?? null;
    } catch {
      // Treat unreachable Supabase as guest — UI handles both states.
    }
  }

  return (
    <html lang="id" className="dark">
      <body className="font-sans antialiased">
        <AuthProvider
          initialUserId={initialUserId}
          initialEmail={initialEmail}
        >
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
            {children}
          </main>
          <SyncStatusToast />
        </AuthProvider>
      </body>
    </html>
  );
}
