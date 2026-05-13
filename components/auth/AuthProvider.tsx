"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

interface AuthContextValue {
  userId: string | null;
  email: string | null;
  isSignedIn: boolean;
  isLoading: boolean;
  /** Forces a session refresh from Supabase. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUserId,
  initialEmail,
  children,
}: {
  initialUserId: string | null;
  initialEmail: string | null;
  children: React.ReactNode;
}) {
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const [email, setEmail] = useState<string | null>(initialEmail);
  const [isLoading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
      setEmail(data.user?.email ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      userId,
      email,
      isSignedIn: Boolean(userId),
      isLoading,
      refresh,
    }),
    [userId, email, isLoading, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
