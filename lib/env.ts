/**
 * Centralized env access. Throw early when a required var is missing.
 * Server-only secrets are read on the server only — never imported by
 * client components.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `See .env.example for the full list.`,
    );
  }
  return value;
}

function optional(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

export const publicEnv = {
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000"),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export function getServerEnv() {
  return {
    appUrl: publicEnv.appUrl,
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", publicEnv.supabaseUrl),
    supabaseAnonKey: required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      publicEnv.supabaseAnonKey,
    ),
    supabaseServiceRoleKey: optional(process.env.SUPABASE_SERVICE_ROLE_KEY),
    googleClientId: optional(process.env.GOOGLE_CLIENT_ID),
    googleClientSecret: optional(process.env.GOOGLE_CLIENT_SECRET),
    googleCalendarRedirectUri: optional(
      process.env.GOOGLE_CALENDAR_REDIRECT_URI,
    ),
    tokenEncryptionKey: optional(process.env.TOKEN_ENCRYPTION_KEY),
  };
}

/** True if the runtime is sufficiently configured to talk to Supabase. */
export function isSupabaseConfigured(): boolean {
  return (
    publicEnv.supabaseUrl.length > 0 && publicEnv.supabaseAnonKey.length > 0
  );
}

/** True if Google Calendar can be connected (server-side check). */
export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_CALENDAR_REDIRECT_URI,
  );
}
