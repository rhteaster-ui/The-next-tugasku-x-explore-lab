---
name: testing-auth-cloud-foundation
description: End-to-end test the web/ Next.js 14 auth + cloud foundation (Supabase Auth, RLS, guest IndexedDB, onboarding/splash, Google Calendar). Use whenever a PR touches web/, supabase/migrations/, or middleware.ts. Most golden-path checks work without Supabase creds (middleware bypasses); only login round-trip + cloud sync + Google Calendar OAuth need creds.
---

# Testing the auth + cloud foundation

The Next.js app lives under `web/`. Old folders (`Dipsik-ai-tes-project-main/`, `TugasKu4-main/`, `src/`) are kept as reference and are NOT what this skill tests.

## When this skill applies

- PRs that touch `web/app/**`, `web/components/**`, `web/lib/**`, `web/middleware.ts`, or `supabase/migrations/**`.
- Anything touching the onboarding gate, sync badge, MigrationDialog, storage adapters, or Google Calendar integration routes.

## Devin Secrets Needed

Three depth tiers — pick the lowest tier that covers what the PR changed:

| Tier | Tests possible | Required env vars |
|---|---|---|
| **0 — no creds** | Onboarding 3-slide → splash, IndexedDB guest persistence, login page wiring (HTML5 validation + amber notice), public-page regression, header auth-aware in guest mode | none |
| **1 — Supabase only** | Login round-trip (email magic link OR Google), MigrationDialog, cloud sync strategies, RLS at runtime | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **2 — full** | Google Calendar OAuth connect, encrypted token storage, event CRUD round-trip, `tasks.google_calendar_event_id` mutation | tier-1 + `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI`, `TOKEN_ENCRYPTION_KEY` (32-byte hex) |

Ask the user for what they have — don't request all three tiers up front. Most PRs only need tier 0.

## Step 0 — Boot the app

```
cd web && npm install   # (cached by blueprint)
npm run dev             # serves on :3000
```

With no `.env.local`, the middleware skip-branch fires (`lib/supabase/middleware.ts` → `if (!isSupabaseConfigured()) return response;`) so protected routes like `/tugasku/*` are reachable as guest. The login page surfaces an amber "Supabase belum dikonfigurasi" notice. This is intentional and is the testing surface for tier-0.

## Step 1 — Maximize browser + start recording

```
sudo apt-get install -y wmctrl 2>/dev/null; wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz
```

Do NOT use `xdotool key super+Up` (tiles instead of maximizes on KDE).

## Step 2 — Tier-0 adversarial checks (no creds)

Every assertion below would visibly fail if the corresponding feature were broken.

### T1 — Onboarding 3-slide → splash brand entrance

Reset before each run by clearing two keys via DevTools Application tab (F12):
- `localStorage.tugasku.onboarding_completed`
- `sessionStorage.tugasku.splash_shown_at`

Then navigate to `http://localhost:3000/`.

- Slide 1 title must read **Selamat datang di TugasKu** (literal). "Lewati" link top-right; "Kembali" disabled.
- Click "Lanjut" twice. On slide 3 the title is **Aman & sinkron kalau mau** AND the primary CTA text flips from **Lanjut** → **Mulai**. (This is the adversarial check that `isLast` logic is wired; a broken impl would keep showing "Lanjut".)
- Click Mulai → modal closes; `localStorage.tugasku.onboarding_completed === "1"`.
- Delete ONLY `sessionStorage.tugasku.splash_shown_at` and reload. The 3-slide must NOT reappear; instead the splash brand entrance flashes briefly (1.1s). Best evidence: the screen recording (still screenshots may miss the 1.1s window).
- Reload again → page renders directly to hero, no splash, no 3-slide. (sessionStorage flag re-set by splash mode `useEffect`.)

If you can't catch the splash visually due to the 1.1s timeout, the indirect proof is that `sessionStorage.tugasku.splash_shown_at` is re-written to "1" after reload — the only code path that does this without user input is the splash `useEffect`.

### T2 — Guest tasks: IndexedDB persistence

Navigate to `/tugasku/tasks` (URL bar — middleware skips because no Supabase env).

- Add 2 tasks via the form. Newest must appear on top (sorted by `updated_at` desc).
- In DevTools → Application → IndexedDB → `tugasku.local` → `tasks`, expand a row and verify the schema: `priority`, `status: "todo"`, `source: "tugasku"`, `user_id: "guest"`. Not a mock — the local adapter writes the full Task shape.
- F5 reload. Both tasks reappear.
- Click the checkbox on a task → strikethrough + filled brand-color checkbox. Reload → strikethrough survives.
- Click "Hapus" → task removed. Reload → removal persists.

### T3 — Auth-aware header + real login page

- Header right side has a `Local only` pill + a green `Masuk` link. Click Masuk → URL becomes `/auth/login`.
- `/auth/login` shows an amber-bordered notice referencing `.env.example`, `.env.local`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Form has Google button (`Lanjut dengan Google`), email input, `Kirim tautan masuk` button.
- Type `not-an-email` and submit → browser HTML5 validation tooltip fires (`Please include an '@'...`). Proves the form is wired to a real `<form type=email>` handler, not a stub button.

### T4 — Regression: `/` and `/explore-lab` remain public

Navigate to each via the URL bar. Both must render full content; no redirect to `/auth/login`. The `PROTECTED_PREFIXES` list in `lib/supabase/middleware.ts` does NOT include `/` or bare `/explore-lab` — only `/explore-lab/{chat,image,tools}` are auth-aware.

## Step 3 — Tier-1 checks (Supabase configured)

1. Apply `supabase/migrations/0001_initial_schema.sql` via the Supabase SQL editor or `supabase db push`.
2. Set tier-1 env vars in `web/.env.local`.
3. Restart `npm run dev`.
4. Now `/auth/login` no longer shows the amber notice. Submit a valid email → expect "Tautan masuk dikirim" success state.
5. After session is established (callback writes auth cookie), navigate to `/tugasku/dashboard`. If guest-mode IndexedDB has rows from a previous tier-0 session, the **MigrationDialog** mounts and offers Merge / Push local / Keep local. Inspect Supabase `tasks` table after Merge to confirm RLS-scoped rows landed.

## Step 4 — Tier-2 checks (Google Calendar)

1. Set tier-2 env vars.
2. Visit `/settings/integrations` → click Connect → grant scope → callback returns to `/settings/integrations?connected=1`.
3. In Supabase `connected_accounts` table, the row must have `access_token` and `refresh_token` formatted as `${ivHex}:${tagHex}:${cipherHex}` (AES-256-GCM, never plaintext).
4. Create a task with a due date → POST `/api/integrations/google-calendar/create-event` → verify event appears on the user's actual Google Calendar AND `tasks.google_calendar_event_id` is populated.
5. Click Disconnect → row removed from `connected_accounts`, `user_settings.calendar_sync_enabled = false`.

## Common gotchas

- **`computer.console` tool refuses with "Chrome is not in the foreground"** even when Chrome is the active window per `xdotool getactivewindow`. Workaround: drive DevTools Application UI directly (F12 → Application → Local/Session Storage / IndexedDB) for storage assertions. This is more visible to a recording viewer anyway.
- **Splash brand entrance is 1100ms.** Easy to miss with a screenshot. Use the recording itself as primary evidence and the sessionStorage re-write as indirect proof.
- **`web/lib/crypto.ts` is server-only.** Importing it from a client component will fail the build with a node:crypto bundling error — this is intentional and protects encryption keys.
- **The `/tugasku/dashboard` page mounts `MigrationDialog` but it returns null for guests.** Don't try to trigger MigrationDialog without an authenticated session.
- **Dropdown options can render with dark CSS that hides hovered rows visually.** When testing the priority select, just click the position where the option would be (Rendah/Sedang/Tinggi) — the selection takes effect even if the visual is faint.
- **Repo has 4 top-level project roots**: `web/` (new — what this skill tests), `Dipsik-ai-tes-project-main/`, `TugasKu4-main/`, `src/` (reference only — `testing-explore-lab` skill covers the Dipsik one).

## Lint / build / typecheck commands

From `web/`:
- `npm run lint` — ESLint, must be 0 warnings
- `npm run typecheck` — `tsc --noEmit`, must be 0 errors
- `npm run build` — production build, must succeed (26 routes as of PR #1)
- `npm run dev` — local dev server on `:3000`
