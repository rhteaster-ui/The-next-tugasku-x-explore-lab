-- =============================================================
-- TugasKu × Explore Lab — initial schema + RLS
-- =============================================================
-- This migration:
--   1. Creates the 9 core tables described in Promt.txt
--   2. Enables Row Level Security on every user-owned table
--   3. Adds CRUD policies scoped by auth.uid() = user_id
--   4. Adds a trigger that auto-provisions `profiles` and
--      `user_settings` rows when a new auth user signs up
-- Run from the Supabase SQL editor or via `supabase db push`.
-- =============================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- 1. profiles -- shadow of auth.users with display metadata
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 2. tasks
-- -------------------------------------------------------------
create table if not exists public.tasks (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  title                    text not null,
  description              text,
  status                   text not null default 'todo' check (status in ('todo','in_progress','done','archived')),
  priority                 text not null default 'medium' check (priority in ('low','medium','high')),
  due_date                 timestamptz,
  tags                     text[] not null default '{}',
  source                   text,
  google_calendar_event_id text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_due_date_idx on public.tasks(due_date);

-- -------------------------------------------------------------
-- 3. notes
-- -------------------------------------------------------------
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null default '',
  content    text not null default '',
  tags       text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_user_id_idx on public.notes(user_id);

-- -------------------------------------------------------------
-- 4. focus_sessions
-- -------------------------------------------------------------
create table if not exists public.focus_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text,
  duration_minutes integer not null check (duration_minutes >= 0),
  started_at       timestamptz not null,
  ended_at         timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists focus_sessions_user_id_idx on public.focus_sessions(user_id);

-- -------------------------------------------------------------
-- 5. ai_chats
-- -------------------------------------------------------------
create table if not exists public.ai_chats (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text,
  provider   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ai_chats_user_id_idx on public.ai_chats(user_id);

-- -------------------------------------------------------------
-- 6. ai_messages
-- -------------------------------------------------------------
create table if not exists public.ai_messages (
  id         uuid primary key default gen_random_uuid(),
  chat_id    uuid not null references public.ai_chats(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('system','user','assistant','tool')),
  content    text not null,
  metadata   jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ai_messages_chat_id_idx on public.ai_messages(chat_id);
create index if not exists ai_messages_user_id_idx on public.ai_messages(user_id);

-- -------------------------------------------------------------
-- 7. image_generations
-- -------------------------------------------------------------
create table if not exists public.image_generations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  prompt     text not null,
  image_url  text not null,
  provider   text,
  metadata   jsonb,
  created_at timestamptz not null default now()
);
create index if not exists image_generations_user_id_idx on public.image_generations(user_id);

-- -------------------------------------------------------------
-- 8. user_settings
-- -------------------------------------------------------------
create table if not exists public.user_settings (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null unique references auth.users(id) on delete cascade,
  theme                    text not null default 'system' check (theme in ('system','light','dark')),
  onboarding_completed     boolean not null default false,
  default_reminder_minutes integer not null default 60 check (default_reminder_minutes >= 0),
  calendar_sync_enabled    boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 9. connected_accounts -- encrypted provider tokens
-- -------------------------------------------------------------
create table if not exists public.connected_accounts (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  provider                  text not null,
  provider_account_id       text not null,
  scope                     text,
  access_token_encrypted    text,
  refresh_token_encrypted   text,
  expires_at                timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (user_id, provider)
);
create index if not exists connected_accounts_user_id_idx on public.connected_accounts(user_id);

-- =============================================================
-- updated_at trigger helper
-- =============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'profiles','tasks','notes','ai_chats',
      'user_settings','connected_accounts'
    ])
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.profiles            enable row level security;
alter table public.tasks               enable row level security;
alter table public.notes               enable row level security;
alter table public.focus_sessions      enable row level security;
alter table public.ai_chats            enable row level security;
alter table public.ai_messages         enable row level security;
alter table public.image_generations   enable row level security;
alter table public.user_settings       enable row level security;
alter table public.connected_accounts  enable row level security;

-- Helper macro: generate 4 standard CRUD policies for tables keyed by user_id.
-- Each policy enforces auth.uid() = user_id.
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'tasks','notes','focus_sessions','ai_chats','ai_messages',
      'image_generations','user_settings','connected_accounts'
    ])
  loop
    execute format(
      'drop policy if exists "%1$s_select_own" on public.%1$s;
       create policy "%1$s_select_own" on public.%1$s
         for select using (auth.uid() = user_id);

       drop policy if exists "%1$s_insert_own" on public.%1$s;
       create policy "%1$s_insert_own" on public.%1$s
         for insert with check (auth.uid() = user_id);

       drop policy if exists "%1$s_update_own" on public.%1$s;
       create policy "%1$s_update_own" on public.%1$s
         for update using (auth.uid() = user_id)
         with check (auth.uid() = user_id);

       drop policy if exists "%1$s_delete_own" on public.%1$s;
       create policy "%1$s_delete_own" on public.%1$s
         for delete using (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

-- profiles policies (id = auth user id, not user_id column)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- =============================================================
-- Auto-provision profile + settings on signup
-- =============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name', null),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
