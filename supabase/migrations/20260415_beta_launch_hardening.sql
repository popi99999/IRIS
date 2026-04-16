-- IRIS beta launch hardening

create table if not exists public.admin_users (
  email text primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  role text not null default 'admin',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_users_user_id_idx on public.admin_users (user_id);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.handle_updated_at();

revoke all on table public.admin_users from anon, authenticated;

insert into public.admin_users (email, role)
values ('irisadminojmpx0nd@deltajohnsons.com', 'admin')
on conflict (email) do update
set role = excluded.role;

create or replace function public.is_iris_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where
      (auth.uid() is not null and a.user_id = auth.uid())
      or lower(a.email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

create or replace function public.sync_profile_admin_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_admin_email text;
begin
  new.email := lower(coalesce(new.email, ''));

  select a.email
    into matched_admin_email
    from public.admin_users a
   where lower(a.email) = new.email
      or (a.user_id is not null and a.user_id = new.id)
   limit 1;

  if matched_admin_email is not null then
    new.role := 'admin';
    update public.admin_users
       set user_id = new.id
     where lower(email) = lower(matched_admin_email)
       and user_id is distinct from new.id;
  elsif tg_op = 'UPDATE'
    and lower(coalesce(new.role, '')) is distinct from lower(coalesce(old.role, ''))
    and not public.is_iris_admin() then
    new.role := old.role;
  elsif tg_op = 'INSERT' and lower(coalesce(new.role, '')) = 'admin' then
    new.role := 'buyer';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_admin_role_guard on public.profiles;
create trigger profiles_admin_role_guard
before insert or update on public.profiles
for each row execute function public.sync_profile_admin_role();

update public.admin_users a
set user_id = p.id
from public.profiles p
where lower(p.email) = lower(a.email)
  and a.user_id is distinct from p.id;

update public.profiles p
set role = 'admin'
from public.admin_users a
where lower(p.email) = lower(a.email)
  and lower(coalesce(p.role, '')) <> 'admin';

alter table public.offers
  add column if not exists decision_in_progress text not null default '',
  add column if not exists processing_by_email text not null default '',
  add column if not exists processing_started_at_ms bigint;

create unique index if not exists offers_active_authorization_idx
  on public.offers (buyer_email, listing_id, offer_amount, currency)
  where status in ('awaiting_authorization', 'pending', 'processing');

create index if not exists offers_processing_started_idx
  on public.offers (processing_started_at_ms)
  where status = 'processing';

create table if not exists public.payout_releases (
  order_id text primary key references public.orders(id) on delete cascade,
  seller_email text not null default '',
  payout_account_id text not null default '',
  payout_amount numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  transfer_group text not null default '',
  idempotency_key text not null default '',
  stripe_transfer_id text not null default '',
  status text not null default 'processing',
  last_error text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists payout_releases_transfer_idx
  on public.payout_releases (stripe_transfer_id)
  where stripe_transfer_id <> '';

drop trigger if exists payout_releases_set_updated_at on public.payout_releases;
create trigger payout_releases_set_updated_at
before update on public.payout_releases
for each row execute function public.handle_updated_at();

alter table public.payout_releases enable row level security;

drop policy if exists "payout_releases_admin_only" on public.payout_releases;
create policy "payout_releases_admin_only"
on public.payout_releases
for all
to authenticated
using (public.is_iris_admin())
with check (public.is_iris_admin());

create table if not exists public.stripe_webhook_events (
  id text primary key,
  event_type text not null default '',
  status text not null default 'processing',
  attempts_count integer not null default 1,
  processed_at timestamptz,
  last_error text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists stripe_webhook_events_set_updated_at on public.stripe_webhook_events;
create trigger stripe_webhook_events_set_updated_at
before update on public.stripe_webhook_events
for each row execute function public.handle_updated_at();

alter table public.stripe_webhook_events enable row level security;

drop policy if exists "stripe_webhook_events_admin_only" on public.stripe_webhook_events;
create policy "stripe_webhook_events_admin_only"
on public.stripe_webhook_events
for all
to authenticated
using (public.is_iris_admin())
with check (public.is_iris_admin());

drop policy if exists "orders_select_parties" on public.orders;
create policy "orders_select_parties"
on public.orders
for select
to authenticated
using (
  buyer_id = auth.uid()
  or (auth.jwt()->>'email') = any(seller_emails)
  or public.is_iris_admin()
);

drop policy if exists "orders_insert_parties" on public.orders;
create policy "orders_insert_parties"
on public.orders
for insert
to authenticated
with check (
  buyer_id = auth.uid()
  or (auth.jwt()->>'email') = any(seller_emails)
  or public.is_iris_admin()
);

drop policy if exists "orders_update_parties" on public.orders;
create policy "orders_update_parties"
on public.orders
for update
to authenticated
using (
  buyer_id = auth.uid()
  or (auth.jwt()->>'email') = any(seller_emails)
  or public.is_iris_admin()
)
with check (
  buyer_id = auth.uid()
  or (auth.jwt()->>'email') = any(seller_emails)
  or public.is_iris_admin()
);

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin"
on public.orders
for delete
to authenticated
using (public.is_iris_admin());

drop policy if exists "support_tickets_select_parties" on public.support_tickets;
create policy "support_tickets_select_parties"
on public.support_tickets
for select
to authenticated
using (
  requester_id = auth.uid()
  or (auth.jwt()->>'email') = buyer_email
  or (auth.jwt()->>'email') = seller_email
  or public.is_iris_admin()
);

drop policy if exists "support_tickets_insert_parties" on public.support_tickets;
create policy "support_tickets_insert_parties"
on public.support_tickets
for insert
to authenticated
with check (
  requester_id = auth.uid()
  or (auth.jwt()->>'email') = buyer_email
  or (auth.jwt()->>'email') = seller_email
  or public.is_iris_admin()
);

drop policy if exists "support_tickets_update_parties" on public.support_tickets;
create policy "support_tickets_update_parties"
on public.support_tickets
for update
to authenticated
using (
  requester_id = auth.uid()
  or (auth.jwt()->>'email') = buyer_email
  or (auth.jwt()->>'email') = seller_email
  or public.is_iris_admin()
)
with check (
  requester_id = auth.uid()
  or (auth.jwt()->>'email') = buyer_email
  or (auth.jwt()->>'email') = seller_email
  or public.is_iris_admin()
);

drop policy if exists "reviews_update_buyer" on public.reviews;
create policy "reviews_update_buyer"
on public.reviews
for update
to authenticated
using (
  buyer_id = auth.uid()
  or public.is_iris_admin()
)
with check (
  buyer_id = auth.uid()
  or public.is_iris_admin()
);

drop policy if exists "reviews_delete_buyer" on public.reviews;
create policy "reviews_delete_buyer"
on public.reviews
for delete
to authenticated
using (
  buyer_id = auth.uid()
  or public.is_iris_admin()
);

drop policy if exists "measurement_requests_select_parties" on public.measurement_requests;
create policy "measurement_requests_select_parties"
on public.measurement_requests
for select
to authenticated
using (
  requester_id = auth.uid()
  or (auth.jwt()->>'email') = requester_email
  or (auth.jwt()->>'email') = seller_email
  or public.is_iris_admin()
);

drop policy if exists "measurement_requests_update_parties" on public.measurement_requests;
create policy "measurement_requests_update_parties"
on public.measurement_requests
for update
to authenticated
using (
  requester_id = auth.uid()
  or (auth.jwt()->>'email') = requester_email
  or (auth.jwt()->>'email') = seller_email
  or public.is_iris_admin()
)
with check (
  requester_id = auth.uid()
  or (auth.jwt()->>'email') = requester_email
  or (auth.jwt()->>'email') = seller_email
  or public.is_iris_admin()
);

drop policy if exists "notifications_select_recipient" on public.notifications;
create policy "notifications_select_recipient"
on public.notifications
for select
to authenticated
using (
  recipient_id = auth.uid()
  or (auth.jwt()->>'email') = recipient_email
  or (public.is_iris_admin() and audience = 'admin')
);

drop policy if exists "notifications_update_recipient" on public.notifications;
create policy "notifications_update_recipient"
on public.notifications
for update
to authenticated
using (
  recipient_id = auth.uid()
  or (auth.jwt()->>'email') = recipient_email
  or (public.is_iris_admin() and audience = 'admin')
)
with check (
  recipient_id = auth.uid()
  or (auth.jwt()->>'email') = recipient_email
  or (public.is_iris_admin() and audience = 'admin')
);

drop policy if exists "notifications_delete_recipient" on public.notifications;
create policy "notifications_delete_recipient"
on public.notifications
for delete
to authenticated
using (
  recipient_id = auth.uid()
  or (auth.jwt()->>'email') = recipient_email
  or (public.is_iris_admin() and audience = 'admin')
);
