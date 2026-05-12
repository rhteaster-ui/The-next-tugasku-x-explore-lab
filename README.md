# The Next TugasKu × Explore Lab

**TugasKu** adalah AI-powered productivity workspace dengan
local-first storage, cloud sync opsional, dan integrasi Google
Calendar. **Explore Lab** adalah AI layer-nya — chat, web search,
image studio — yang terhubung ke TugasKu.

Fase ini menambahkan **fondasi auth + cloud-ready architecture**:
Supabase Auth, schema lengkap dengan RLS, storage abstraction
local→cloud, Google Calendar integration foundation, dan onboarding
yang benar (3-slide hanya untuk first run).

## Struktur repo

```
.
├── web/                 # Next.js 14 App Router + TypeScript app
├── supabase/            # SQL migrations + RLS
├── Dipsik-ai-tes-project-main/   # legacy: Explore Lab static prototype
├── TugasKu4-main/                # legacy: TugasKu single-page PWA
└── src/                          # legacy assets (splash, icons)
```

Folder `Dipsik-ai-tes-project-main/`, `TugasKu4-main/`, dan `src/`
adalah artefak fase sebelumnya — tidak digunakan oleh `web/` tapi
sengaja dipertahankan sebagai referensi visual & API gateway.

## Quick start

```bash
cd web
cp .env.example .env.local
# isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, dst.
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## 1. File & struktur auth

```
web/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx              # halaman masuk
│   │   ├── callback/route.ts           # OAuth / magic link callback
│   │   └── logout/route.ts             # POST/GET → sign out
│   ├── account/page.tsx                # akun + logout
│   ├── settings/
│   │   ├── account/page.tsx            # ubah display_name
│   │   └── integrations/page.tsx       # Connect/disconnect Google Calendar
│   ├── tugasku/*                       # protected routes
│   └── explore-lab/*                   # marketing public + tools protected
├── components/auth/                    # LoginForm, AuthProvider, LogoutButton
├── components/onboarding/              # 3-slide first-run + brand splash
├── components/storage/MigrationDialog  # merge / push / keep dialog setelah login
├── components/integrations/            # Google Calendar panel
├── lib/supabase/                       # browser, server, middleware client
├── lib/storage/                        # local + cloud adapters + sync manager
├── lib/google/                         # Calendar OAuth + events helper
├── lib/crypto.ts                       # AES-256-GCM token encryption
└── middleware.ts                       # protected route gating
```

## 2. Route auth yang tersedia

| Route | Mode | Catatan |
| --- | --- | --- |
| `/` | public | Landing TugasKu |
| `/explore-lab` | public | Marketing Explore Lab |
| `/auth/login` | public | Sign in (Google + magic link) |
| `/auth/callback` | system | PKCE exchange ke session |
| `/auth/logout` | system | Sign out (POST/GET) |
| `/account` | **protected** | Profil + logout + reset onboarding |
| `/settings/account` | **protected** | Edit display name |
| `/settings/integrations` | **protected** | Google Calendar connect/disconnect |
| `/tugasku/*` | **protected** | Dashboard, tasks, calendar, focus, notes, assistant |
| `/explore-lab/{chat,image,tools}` | **protected** | Tools yang menyimpan history |
| `/api/integrations/google-calendar/*` | **protected** (kecuali `callback`) | OAuth flow + CRUD event |

Anonymous user yang membuka route protected akan di-redirect ke
`/auth/login?next=<original>`. User yang sudah login dan membuka
`/auth/login` di-redirect ke `/tugasku/dashboard`.

## 3. Cara setup environment variable

Salin `.env.example` ke `.env.local`:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # SERVER ONLY
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/integrations/google-calendar/callback
TOKEN_ENCRYPTION_KEY=<32-byte hex>
```

Generate `TOKEN_ENCRYPTION_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> `SUPABASE_SERVICE_ROLE_KEY` dan `TOKEN_ENCRYPTION_KEY` **tidak boleh**
> di-expose ke browser. Variabel publik harus diawali `NEXT_PUBLIC_`.

## 4. Cara menjalankan Supabase migration

Lihat [`supabase/README.md`](supabase/README.md). Singkatnya:

```bash
# Opsi A: paste manual ke SQL editor
# Opsi B: pakai Supabase CLI
supabase link --project-ref <ref>
supabase db push
```

Migration **idempotent** — aman dijalankan ulang.

## 5. Tabel database

Lihat `supabase/migrations/0001_initial_schema.sql`:

`profiles`, `tasks`, `notes`, `focus_sessions`, `ai_chats`,
`ai_messages`, `image_generations`, `user_settings`,
`connected_accounts`.

Lihat tabel ringkas di `supabase/README.md`.

## 6. RLS policy

Setiap tabel berbasis `user_id` mendapatkan 4 policy standar:

- `select` untuk `auth.uid() = user_id`
- `insert` butuh `auth.uid() = user_id` di row baru
- `update` cek `auth.uid()` di old & new
- `delete` butuh `auth.uid() = user_id`

`profiles` pakai pola sama dengan kolom `id` (sama dengan
`auth.users.id`). Trigger `handle_new_user()` membuat row `profiles`
+ `user_settings` saat user signup, jadi tidak ada race-condition
"profile belum ada".

## 7. Guest mode vs signed-in mode

**Guest mode:**

- Data tersimpan di IndexedDB (fallback localStorage)
- Adapter: `lib/storage/local-adapter.ts`
- Badge "Local only" di header
- TugasKu tasks/notes/focus tetap berjalan offline-first

**Signed-in mode:**

- Data tersimpan di Supabase (RLS-scoped)
- Adapter: `lib/storage/cloud-adapter.ts`
- Badge bisa `Saved locally`, `Syncing…`, `Synced`, `Sync failed`
- Auto-prompt migrasi data lokal ke cloud saat pertama kali login

UI tidak memaksa login. CTA-nya halus:
"Lanjut tanpa login", "Masuk untuk sinkronisasi", "Backup data lokal
ke akun".

## 8. Cara kerja local-to-cloud sync

`lib/storage/sync-manager.ts` mengelola migrasi:

- **`merge`** (default): row dengan `updated_at` terbaru menang.
  Cloud + local di-rekonsiliasi, kemudian dorong hasil ke cloud dan
  refresh local mirror.
- **`push_local`**: anggap lokal source of truth, timpa cloud.
- **`pull_cloud`**: anggap cloud source of truth, timpa lokal.
- **`keep_local`**: lewati sinkronisasi, tetap pakai lokal.

`MigrationDialog` muncul **sekali** setelah login pertama saat data
lokal ditemukan. Setelah keputusan diambil, flag
`tugasku.local.migration_offered` disimpan agar dialog tidak muncul
lagi.

Status real-time muncul di header (`SyncBadge`) dan toast
(`SyncStatusToast`): `Saved locally → Syncing… → Synced` atau
`Sync failed` dengan detail error.

## 9. Cara kerja splash/onboarding baru

`OnboardingGate` (di landing page) memutuskan mode:

1. **First run:** `localStorage.tugasku.onboarding_completed` belum
   set → tampilkan 3 slide (splash1/2/3) dengan tombol Lewati /
   Kembali / Lanjut / Mulai.
2. **Setelah onboarding:** flag di-set ke `1`. Splash 3-slide tidak
   muncul lagi.
3. **Kunjungan berikutnya:** hanya splash brand (splash1.png) yang
   muncul ~1 detik sebagai loading/brand entrance, sekali per sesi
   (`sessionStorage.tugasku.splash_shown_at`).
4. **Reset:** tombol "Lihat lagi onboarding" di `/account` menghapus
   flag dan reload.

Saat user login, `user_settings.onboarding_completed` boleh
disinkronkan ke cloud melalui sync manager — disiapkan via tabel
`user_settings` tapi bisa di-extend pada fase berikutnya.

## 10. Cara kerja Google Calendar integration foundation

- `Settings → Integrasi` punya tombol **Connect Google Calendar**.
- `POST /api/integrations/google-calendar/connect` → generate state
  random, simpan di httpOnly cookie, return Google consent URL.
- User memberi izin → Google redirect ke
  `/api/integrations/google-calendar/callback`.
- Callback verifikasi state (CSRF), tukar code ke token, **enkripsi
  AES-256-GCM** dengan `TOKEN_ENCRYPTION_KEY`, simpan ke
  `connected_accounts` lewat admin client (service role).
- `user_settings.calendar_sync_enabled` di-set true.
- Endpoint event:
  - `POST /api/integrations/google-calendar/create-event`
  - `POST /api/integrations/google-calendar/update-event`
  - `POST /api/integrations/google-calendar/delete-event`
- `POST /api/integrations/google-calendar/disconnect` → hapus row di
  `connected_accounts` + matikan flag.

Token tidak pernah ke browser; client hanya berbicara dengan API
route yang membaca/menulis lewat admin client.

**Permission Calendar terpisah dari login utama** — login Google
default tidak meminta akses Calendar.

## 11. TODO production hardening

- Token refresh otomatis pakai refresh_token + reschedule ke
  `connected_accounts.expires_at`.
- Rate limit + audit log pada endpoint `/api/integrations/google-calendar/*`.
- Sentry / OpenTelemetry untuk error tracking middleware + RSC.
- E2E test (Playwright) untuk: guest flow, login flow, migration
  dialog, GCal connect/disconnect.
- CSP header (script-src `'self'`, `connect-src` ke Supabase + Google).
- Migration history (Supabase CLI / db-migrate) di CI.
- Background worker untuk sync ulang jika `sync_failed` (mis. saat
  jaringan kembali).
- Field-level encryption untuk catatan sensitif (libsodium).
- i18n: saat ini bahasa Indonesia hard-coded di copy.
- Tema light mode (dark sudah default; saklar tema di Settings).

## Scripts

```bash
cd web
npm run dev         # next dev
npm run build       # production build
npm run start       # node server
npm run lint        # next lint
npm run typecheck   # tsc --noEmit
```
