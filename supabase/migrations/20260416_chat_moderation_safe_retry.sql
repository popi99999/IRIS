-- ============================================================
-- IRIS Marketplace — chat moderation hardening (safe retry)
-- Use this if the original step 2 migration fails in Supabase.
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_iris_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result boolean := false;
begin
  if to_regclass('public.admin_users') is null then
    return false;
  end if;

  execute $sql$
    select exists (
      select 1
      from public.admin_users a
      where
        (auth.uid() is not null and a.user_id = auth.uid())
        or lower(a.email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  $sql$
  into v_result;

  return coalesce(v_result, false);
end;
$$;

create table if not exists public.chat_moderation_users (
  user_id uuid primary key,
  violation_count integer not null default 0,
  last_violation_at_ms bigint not null default 0,
  last_violation_at timestamptz,
  last_violation_reason text not null default '',
  last_action text not null default '',
  chat_banned boolean not null default false,
  chat_banned_until timestamptz,
  moderation_notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists chat_moderation_users_action_idx
  on public.chat_moderation_users (last_action, violation_count desc);

drop trigger if exists chat_moderation_users_set_updated_at on public.chat_moderation_users;
create trigger chat_moderation_users_set_updated_at
before update on public.chat_moderation_users
for each row execute function public.handle_updated_at();

alter table public.chat_moderation_users enable row level security;

drop policy if exists "chat_moderation_users_select_self" on public.chat_moderation_users;
create policy "chat_moderation_users_select_self"
on public.chat_moderation_users
for select
to authenticated
using (
  public.is_iris_admin()
  or user_id = auth.uid()
);

drop policy if exists "chat_moderation_users_no_insert" on public.chat_moderation_users;
drop policy if exists "chat_moderation_users_no_update" on public.chat_moderation_users;
drop policy if exists "chat_moderation_users_no_delete" on public.chat_moderation_users;

create table if not exists public.chat_moderation_events (
  id text primary key,
  user_id uuid not null,
  conversation_id text,
  raw_message_redacted text not null default '',
  normalized_forms jsonb not null default '{}'::jsonb,
  triggered_rules text[] not null default '{}'::text[],
  matched_fragments text[] not null default '{}'::text[],
  violation_type text not null default 'mixed',
  confidence numeric(5,2) not null default 0,
  strike_count integer not null default 0,
  action_taken text not null default '',
  created_at_ms bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists chat_moderation_events_user_idx
  on public.chat_moderation_events (user_id, created_at_ms desc);

create index if not exists chat_moderation_events_conversation_idx
  on public.chat_moderation_events (conversation_id, created_at_ms desc);

alter table public.chat_moderation_events enable row level security;

drop policy if exists "chat_moderation_events_select_scoped" on public.chat_moderation_events;
create policy "chat_moderation_events_select_scoped"
on public.chat_moderation_events
for select
to authenticated
using (
  public.is_iris_admin()
  or user_id = auth.uid()
);

drop policy if exists "chat_moderation_events_no_insert" on public.chat_moderation_events;
drop policy if exists "chat_moderation_events_no_update" on public.chat_moderation_events;
drop policy if exists "chat_moderation_events_no_delete" on public.chat_moderation_events;

drop policy if exists "conversation_messages_insert_parties" on public.conversation_messages;
drop policy if exists "conversation_messages_update_parties" on public.conversation_messages;
drop policy if exists "conversation_messages_delete_parties" on public.conversation_messages;
