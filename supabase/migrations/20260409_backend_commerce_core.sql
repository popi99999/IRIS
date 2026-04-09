create or replace function public.is_iris_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt()->>'email', '') in (
    'owner@iris-fashion.it',
    'admin@iris-fashion.it',
    'support@iris-fashion.it'
  );
$$;

alter table public.profiles
  add column if not exists stripe_customer_id text not null default '',
  add column if not exists stripe_customer_updated_at timestamptz,
  add column if not exists onboarding_state text not null default 'pending';

create table if not exists public.seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null default '',
  payout_provider text not null default 'stripe_connect',
  payout_account_id text not null default '',
  payout_status text not null default 'not_connected',
  payout_details_submitted boolean not null default false,
  payouts_enabled boolean not null default false,
  charges_enabled boolean not null default false,
  verification_status text not null default 'pending',
  verified_seller boolean not null default false,
  concierge_enabled boolean not null default false,
  vat_number text not null default '',
  seller_rating numeric(4,2) not null default 0,
  completed_sales integer not null default 0,
  trust_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists seller_profiles_user_idx on public.seller_profiles (user_id);
create index if not exists seller_profiles_account_idx on public.seller_profiles (payout_account_id);
create index if not exists seller_profiles_verified_idx on public.seller_profiles (verified_seller);

drop trigger if exists seller_profiles_set_updated_at on public.seller_profiles;
create trigger seller_profiles_set_updated_at
before update on public.seller_profiles
for each row execute function public.handle_updated_at();

insert into public.seller_profiles (user_id, display_name)
select
  p.id,
  coalesce(nullif(p.full_name, ''), split_part(p.email, '@', 1))
from public.profiles p
on conflict (user_id) do nothing;

alter table public.seller_profiles enable row level security;

drop policy if exists "seller_profiles_select_public" on public.seller_profiles;
create policy "seller_profiles_select_public"
on public.seller_profiles
for select
to anon, authenticated
using (true);

drop policy if exists "seller_profiles_insert_owner" on public.seller_profiles;
create policy "seller_profiles_insert_owner"
on public.seller_profiles
for insert
to authenticated
with check (user_id = auth.uid() or public.is_iris_admin());

drop policy if exists "seller_profiles_update_owner" on public.seller_profiles;
create policy "seller_profiles_update_owner"
on public.seller_profiles
for update
to authenticated
using (user_id = auth.uid() or public.is_iris_admin())
with check (user_id = auth.uid() or public.is_iris_admin());

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references public.listings(id) on delete cascade,
  storage_path text not null default '',
  public_url text not null default '',
  width integer,
  height integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists listing_images_listing_idx on public.listing_images (listing_id, sort_order);

alter table public.listing_images enable row level security;

drop policy if exists "listing_images_select_public" on public.listing_images;
create policy "listing_images_select_public"
on public.listing_images
for select
to anon, authenticated
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_id
      and (
        (l.listing_status = 'published' and l.inventory_status <> 'archived')
        or l.owner_id = auth.uid()
      )
  )
);

drop policy if exists "listing_images_insert_owner" on public.listing_images;
create policy "listing_images_insert_owner"
on public.listing_images
for insert
to authenticated
with check (
  exists (
    select 1 from public.listings l
    where l.id = listing_id
      and l.owner_id = auth.uid()
  )
);

drop policy if exists "listing_images_update_owner" on public.listing_images;
create policy "listing_images_update_owner"
on public.listing_images
for update
to authenticated
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_id
      and l.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.listings l
    where l.id = listing_id
      and l.owner_id = auth.uid()
  )
);

drop policy if exists "listing_images_delete_owner" on public.listing_images;
create policy "listing_images_delete_owner"
on public.listing_images
for delete
to authenticated
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_id
      and l.owner_id = auth.uid()
  )
);

alter table public.listings
  add column if not exists service_mode text not null default 'self_serve',
  add column if not exists authentication_tier text not null default 'standard',
  add column if not exists authentication_fee_amount numeric(12,2) not null default 10,
  add column if not exists price_currency text not null default 'EUR';

alter table public.offers
  add column if not exists checkout_session_id text not null default '',
  add column if not exists authorization_expires_at timestamptz;

alter table public.orders
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payout_status text not null default 'pending',
  add column if not exists currency text not null default 'EUR',
  add column if not exists checkout_session_id text not null default '',
  add column if not exists payment_intent_id text not null default '',
  add column if not exists transfer_group text not null default '',
  add column if not exists carrier text not null default '',
  add column if not exists tracking_number text not null default '',
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists payment_captured_at timestamptz;

update public.orders
set
  payment_status = coalesce(nullif(payment->>'status', ''), payment_status),
  payout_status = coalesce(nullif(payment->>'payoutStatus', ''), payout_status),
  currency = coalesce(nullif(payment->>'currency', ''), currency, 'EUR'),
  payment_intent_id = coalesce(nullif(payment->>'paymentIntentReference', ''), payment_intent_id),
  carrier = coalesce(nullif(shipping->>'carrier', ''), carrier),
  tracking_number = coalesce(nullif(shipping->>'trackingNumber', ''), tracking_number)
where true;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  listing_id text not null references public.listings(id) on delete restrict,
  seller_id uuid references auth.users(id) on delete set null,
  seller_email text not null default '',
  quantity integer not null default 1,
  unit_amount numeric(12,2) not null default 0,
  buyer_fee_amount numeric(12,2) not null default 0,
  seller_fee_amount numeric(12,2) not null default 0,
  authentication_fee_amount numeric(12,2) not null default 0,
  line_total_amount numeric(12,2) not null default 0,
  service_mode text not null default 'self_serve',
  line_status text not null default 'paid',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_listing_idx on public.order_items (listing_id);
create index if not exists order_items_seller_idx on public.order_items (seller_id);

alter table public.order_items enable row level security;

drop policy if exists "order_items_select_parties" on public.order_items;
create policy "order_items_select_parties"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (
        o.buyer_id = auth.uid()
        or (auth.jwt()->>'email') = any(o.seller_emails)
        or public.is_iris_admin()
      )
  )
);

drop policy if exists "order_items_insert_parties" on public.order_items;
create policy "order_items_insert_parties"
on public.order_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (
        o.buyer_id = auth.uid()
        or (auth.jwt()->>'email') = any(o.seller_emails)
        or public.is_iris_admin()
      )
  )
);

drop policy if exists "order_items_update_parties" on public.order_items;
create policy "order_items_update_parties"
on public.order_items
for update
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (
        o.buyer_id = auth.uid()
        or (auth.jwt()->>'email') = any(o.seller_emails)
        or public.is_iris_admin()
      )
  )
)
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (
        o.buyer_id = auth.uid()
        or (auth.jwt()->>'email') = any(o.seller_emails)
        or public.is_iris_admin()
      )
  )
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text references public.orders(id) on delete cascade,
  offer_id text references public.offers(id) on delete set null,
  provider text not null default 'stripe',
  provider_payment_intent_id text not null default '',
  provider_checkout_session_id text not null default '',
  provider_charge_id text not null default '',
  provider_transfer_group text not null default '',
  status text not null default 'pending',
  amount numeric(12,2) not null default 0,
  buyer_fee_amount numeric(12,2) not null default 0,
  seller_fee_amount numeric(12,2) not null default 0,
  authentication_fee_amount numeric(12,2) not null default 0,
  fee_amount numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  receipt_number text not null default '',
  payout_account_id text not null default '',
  payout_transfer_ids jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  captured_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists payments_provider_intent_idx on public.payments (provider_payment_intent_id) where provider_payment_intent_id <> '';
create index if not exists payments_order_idx on public.payments (order_id);
create index if not exists payments_offer_idx on public.payments (offer_id);
create index if not exists payments_status_idx on public.payments (status);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.handle_updated_at();

alter table public.payments enable row level security;

drop policy if exists "payments_select_parties" on public.payments;
create policy "payments_select_parties"
on public.payments
for select
to authenticated
using (
  public.is_iris_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id
      and (
        o.buyer_id = auth.uid()
        or (auth.jwt()->>'email') = any(o.seller_emails)
      )
  )
  or exists (
    select 1 from public.offers f
    where f.id = offer_id
      and (
        f.buyer_id = auth.uid()
        or f.seller_id = auth.uid()
      )
  )
);

drop policy if exists "payments_write_admin_only" on public.payments;
create policy "payments_write_admin_only"
on public.payments
for all
to authenticated
using (public.is_iris_admin())
with check (public.is_iris_admin());

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  template_key text not null default '',
  recipient_email text not null default '',
  subject text not null default '',
  html_body text not null default '',
  text_body text not null default '',
  status text not null default 'pending',
  provider text not null default 'resend',
  provider_message_id text not null default '',
  related_order_id text,
  related_ticket_id text,
  related_offer_id text,
  payload jsonb not null default '{}'::jsonb,
  attempts_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists email_outbox_status_idx on public.email_outbox (status, created_at);
create index if not exists email_outbox_recipient_idx on public.email_outbox (recipient_email);

drop trigger if exists email_outbox_set_updated_at on public.email_outbox;
create trigger email_outbox_set_updated_at
before update on public.email_outbox
for each row execute function public.handle_updated_at();

alter table public.email_outbox enable row level security;

drop policy if exists "email_outbox_admin_only" on public.email_outbox;
create policy "email_outbox_admin_only"
on public.email_outbox
for all
to authenticated
using (public.is_iris_admin())
with check (public.is_iris_admin());

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id text not null references public.support_tickets(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  author_role text not null default 'user',
  message text not null default '',
  attachment_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists support_messages_ticket_idx on public.support_messages (ticket_id, created_at);

alter table public.support_messages enable row level security;

drop policy if exists "support_messages_select_parties" on public.support_messages;
create policy "support_messages_select_parties"
on public.support_messages
for select
to authenticated
using (
  exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
      and (
        t.requester_id = auth.uid()
        or (auth.jwt()->>'email') = t.buyer_email
        or (auth.jwt()->>'email') = t.seller_email
        or public.is_iris_admin()
      )
  )
);

drop policy if exists "support_messages_insert_parties" on public.support_messages;
create policy "support_messages_insert_parties"
on public.support_messages
for insert
to authenticated
with check (
  exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
      and (
        t.requester_id = auth.uid()
        or (auth.jwt()->>'email') = t.buyer_email
        or (auth.jwt()->>'email') = t.seller_email
        or public.is_iris_admin()
      )
  )
);
