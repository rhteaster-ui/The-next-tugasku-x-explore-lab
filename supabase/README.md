# Supabase setup

The TugasKu × Explore Lab database lives in Supabase Postgres. This
folder holds **schema-as-code** so you can stand up a new project in
minutes.

## 1. Create the project

1. Create a new Supabase project (Free tier is fine).
2. Note the project URL and the **anon** + **service_role** keys.
3. In **Authentication → Providers**, enable:
   - Email (with magic link)
   - Google (paste the same OAuth client you'll use for Calendar)
4. In **Authentication → URL Configuration**, add the production +
   preview redirect URLs:
   - `https://<your-domain>/auth/callback`
   - `http://localhost:3000/auth/callback`

## 2. Apply the schema

Either:

- **SQL editor (quick path):** paste `migrations/0001_initial_schema.sql`
  into the Supabase SQL editor and run it.
- **CLI (recommended):**

  ```bash
  supabase link --project-ref <ref>
  supabase db push
  ```

The migration is **idempotent** — re-running it is safe.

## 3. What it creates

| Table | Purpose |
| --- | --- |
| `profiles` | Display name + avatar mirror of `auth.users` |
| `tasks` | TugasKu tasks (status, priority, due date, GCal id) |
| `notes` | Notes with tags |
| `focus_sessions` | Pomodoro / focus sessions |
| `ai_chats` | Explore Lab chat threads |
| `ai_messages` | Messages within an `ai_chat` |
| `image_generations` | Image studio history |
| `user_settings` | Theme, onboarding flag, reminder defaults |
| `connected_accounts` | Encrypted OAuth tokens (Google Calendar, …) |

## 4. Row Level Security

RLS is **enabled on every user table**. For each table keyed by
`user_id`, the migration installs four policies:

- `select` allowed when `auth.uid() = user_id`
- `insert` requires `auth.uid() = user_id` in the new row
- `update` checks both old and new row
- `delete` requires `auth.uid() = user_id`

`profiles` uses the same pattern but matches on `id` (which equals
`auth.users.id`).

## 5. Auto-provisioning

A trigger on `auth.users INSERT` creates a row in both `profiles` and
`user_settings` for every new user, so the app never has to deal with
"profile doesn't exist yet" edge cases.

## 6. Token encryption

`connected_accounts.access_token_encrypted` and
`refresh_token_encrypted` are wrapped in AES-256-GCM by
`lib/crypto.ts`. The key lives in `TOKEN_ENCRYPTION_KEY` — generate
one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Even if the database is leaked, tokens are useless without that key.
