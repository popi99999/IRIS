create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text default '',
  phone text default '',
  role text default 'buyer',
  city text default '',
  country text default '',
  bio text default '',
  member_since text default '',
  avatar_url text default '',
  addresses jsonb not null default '[]'::jsonb,
  payment_methods jsonb not null default '[]'::jsonb,
  payout_settings jsonb not null default '{}'::jsonb,
  security jsonb not null default '{}'::jsonb,
  verification jsonb not null default '{}'::jsonb,
  notification_settings jsonb not null default '{}'::jsonb,
  shopping_preferences jsonb not null default '{}'::jsonb,
  size_profile jsonb not null default '{}'::jsonb,
  saved_searches jsonb not null default '[]'::jsonb,
  selling_preferences jsonb not null default '{}'::jsonb,
  vacation_mode jsonb not null default '{}'::jsonb,
  listing_preferences jsonb not null default '{}'::jsonb,
  privacy_settings jsonb not null default '{}'::jsonb,
  account_status text not null default 'active',
  ban_reason text default '',
  banned_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_role_idx on public.profiles (role);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    member_since
  )
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    case when new.raw_user_meta_data ->> 'role' in ('buyer', 'seller') then new.raw_user_meta_data ->> 'role' else 'buyer' end,
    to_char(timezone('utc', now()), 'YYYY')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = case when excluded.full_name <> '' then excluded.full_name else public.profiles.full_name end,
    phone = case when excluded.phone <> '' then excluded.phone else public.profiles.phone end,
    role = case when excluded.role <> '' then excluded.role else public.profiles.role end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
