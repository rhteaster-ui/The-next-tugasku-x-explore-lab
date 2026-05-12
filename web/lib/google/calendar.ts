import { google } from "googleapis";

import { getServerEnv } from "@/lib/env";

/**
 * Google Calendar foundation. Two layers:
 *
 *   - `getOAuthClient()` builds a fresh OAuth2 client per request.
 *   - `getCalendar(tokens)` returns an authenticated `calendar` client.
 *
 * Token management (storing access + refresh tokens encrypted in the
 * `connected_accounts` table) is handled by the route handlers in
 * `app/api/integrations/google-calendar/*`.
 */

const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export function getOAuthClient() {
  const env = getServerEnv();
  if (
    !env.googleClientId ||
    !env.googleClientSecret ||
    !env.googleCalendarRedirectUri
  ) {
    throw new Error(
      "Google Calendar is not configured. Set GOOGLE_CLIENT_ID, " +
        "GOOGLE_CLIENT_SECRET, and GOOGLE_CALENDAR_REDIRECT_URI.",
    );
  }
  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleCalendarRedirectUri,
  );
}

export function buildAuthUrl(state: string): string {
  const oauth = getOAuthClient();
  return oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: CALENDAR_SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth = getOAuthClient();
  const { tokens } = await oauth.getToken(code);
  return tokens;
}

export function getCalendar(accessToken: string, refreshToken?: string | null) {
  const oauth = getOAuthClient();
  oauth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
  });
  return google.calendar({ version: "v3", auth: oauth });
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  startISO: string;
  endISO: string;
  reminderMinutes?: number;
}

export async function createEvent(
  accessToken: string,
  refreshToken: string | null,
  input: CalendarEventInput,
): Promise<{ id: string; htmlLink: string | null }> {
  const calendar = getCalendar(accessToken, refreshToken);
  const reminderMinutes = input.reminderMinutes ?? 60;
  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startISO },
      end: { dateTime: input.endISO },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: reminderMinutes }],
      },
    },
  });
  return {
    id: res.data.id ?? "",
    htmlLink: res.data.htmlLink ?? null,
  };
}

export async function updateEvent(
  accessToken: string,
  refreshToken: string | null,
  eventId: string,
  input: CalendarEventInput,
): Promise<void> {
  const calendar = getCalendar(accessToken, refreshToken);
  await calendar.events.update({
    calendarId: "primary",
    eventId,
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startISO },
      end: { dateTime: input.endISO },
    },
  });
}

export async function deleteEvent(
  accessToken: string,
  refreshToken: string | null,
  eventId: string,
): Promise<void> {
  const calendar = getCalendar(accessToken, refreshToken);
  await calendar.events.delete({ calendarId: "primary", eventId });
}
