-- FILE: supabase/migrations/20260408_auth_profiles.sql

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
    coalesce(new.raw_user_meta_data ->> 'role', 'buyer'),
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


-- FILE: supabase/migrations/20260408_listings.sql

create table if not exists public.listings (
  id text primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  owner_email text not null default '',
  name text not null default '',
  brand text not null default '',
  category_label text not null default '',
  category_key text not null default '',
  subcategory_label text not null default '',
  subcategory_key text not null default '',
  product_type_label text not null default '',
  product_type_key text not null default '',
  size_label text not null default '',
  size_original text not null default '',
  size_schema text not null default '',
  condition_label text not null default '',
  fit text not null default '',
  dimensions text not null default '',
  measurements jsonb not null default '{}'::jsonb,
  price numeric(12,2) not null default 0,
  original_price numeric(12,2) not null default 0,
  color text not null default '',
  material text not null default '',
  emoji text not null default '',
  description text not null default '',
  chips jsonb not null default '[]'::jsonb,
  seller_snapshot jsonb not null default '{}'::jsonb,
  image_url text not null default '',
  images jsonb not null default '[]'::jsonb,
  is_user_listing boolean not null default true,
  inventory_status text not null default 'active',
  listing_status text not null default 'published',
  order_id text,
  sold_at timestamptz,
  offers_enabled boolean not null default true,
  minimum_offer_amount numeric(12,2),
  gender text not null default '',
  verified boolean not null default false,
  verified_seller boolean not null default false,
  iris_guaranteed boolean not null default false,
  certificate_code text not null default '',
  authenticated_at timestamptz,
  relist_source_order_id text,
  relist_source_product_id text,
  relist_source_listing_id text,
  relist_source_receipt_number text not null default '',
  relist_source_purchased_at timestamptz,
  relist_source_certified boolean not null default false,
  relist_source_platform text not null default '',
  date_created_ms bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists listings_owner_id_idx on public.listings (owner_id);
create index if not exists listings_owner_email_idx on public.listings (owner_email);
create index if not exists listings_listing_status_idx on public.listings (listing_status);
create index if not exists listings_inventory_status_idx on public.listings (inventory_status);
create index if not exists listings_category_key_idx on public.listings (category_key);
create index if not exists listings_brand_idx on public.listings (brand);

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
before update on public.listings
for each row
execute function public.handle_updated_at();

alter table public.listings enable row level security;

drop policy if exists "Published listings are readable by everyone" on public.listings;
create policy "Published listings are readable by everyone"
on public.listings
for select
to anon, authenticated
using (listing_status = 'published' and inventory_status <> 'archived');

drop policy if exists "Owners can read their listings" on public.listings;
create policy "Owners can read their listings"
on public.listings
for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "Owners can insert their listings" on public.listings;
create policy "Owners can insert their listings"
on public.listings
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "Owners can update their listings" on public.listings;
create policy "Owners can update their listings"
on public.listings
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Owners can delete their listings" on public.listings;
create policy "Owners can delete their listings"
on public.listings
for delete
to authenticated
using (auth.uid() = owner_id);


-- FILE: supabase/migrations/20260408_offers.sql

create table if not exists public.offers (
  id text primary key,
  listing_id text not null,
  product_id text,
  product_name text not null default '',
  product_brand text not null default '',
  buyer_id uuid references auth.users(id) on delete set null,
  buyer_email text not null default '',
  buyer_name text not null default '',
  seller_id uuid references auth.users(id) on delete set null,
  seller_email text not null default '',
  seller_name text not null default '',
  offer_amount numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  status text not null default 'pending',
  created_at_ms bigint not null default 0,
  updated_at_ms bigint not null default 0,
  expires_at_ms bigint,
  payment_authorization_status text not null default 'payment_authorized',
  payment_intent_reference text not null default '',
  authorization_reference text not null default '',
  order_id text,
  shipping_snapshot jsonb not null default '{}'::jsonb,
  payment_method_snapshot jsonb not null default '{}'::jsonb,
  minimum_offer_amount numeric(12,2),
  captured_at_ms bigint,
  released_at_ms bigint,
  release_reason text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists offers_listing_idx on public.offers (listing_id);
create index if not exists offers_buyer_idx on public.offers (buyer_id);
create index if not exists offers_seller_idx on public.offers (seller_id);
create index if not exists offers_status_idx on public.offers (status);
create index if not exists offers_created_idx on public.offers (created_at_ms desc);
create index if not exists offers_expires_idx on public.offers (expires_at_ms);

drop trigger if exists offers_set_updated_at on public.offers;
create trigger offers_set_updated_at
before update on public.offers
for each row execute function public.handle_updated_at();

alter table public.offers enable row level security;

drop policy if exists "offers_select_parties" on public.offers;
create policy "offers_select_parties"
on public.offers
for select
to authenticated
using (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
);

drop policy if exists "offers_insert_buyer" on public.offers;
create policy "offers_insert_buyer"
on public.offers
for insert
to authenticated
with check (
  buyer_id = auth.uid()
);

drop policy if exists "offers_update_parties" on public.offers;
create policy "offers_update_parties"
on public.offers
for update
to authenticated
using (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
)
with check (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
);

drop policy if exists "offers_delete_parties" on public.offers;
create policy "offers_delete_parties"
on public.offers
for delete
to authenticated
using (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
);


-- FILE: supabase/migrations/20260409_orders.sql

create table if not exists public.orders (
  id text primary key,
  number text not null default '',
  buyer_id uuid references auth.users(id) on delete set null,
  buyer_email text not null default '',
  buyer_name text not null default '',
  seller_emails text[] not null default '{}'::text[],
  items jsonb not null default '[]'::jsonb,
  shipping jsonb not null default '{}'::jsonb,
  status text not null default 'paid',
  payment jsonb not null default '{}'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  support_ticket_ids text[] not null default '{}'::text[],
  email_ids text[] not null default '{}'::text[],
  notification_ids text[] not null default '{}'::text[],
  review_status text not null default 'pending',
  created_at_ms bigint not null default 0,
  subtotal numeric(12,2) not null default 0,
  shipping_cost numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  offer_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_buyer_idx on public.orders (buyer_id);
create index if not exists orders_buyer_email_idx on public.orders (buyer_email);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at_ms desc);
create index if not exists orders_offer_idx on public.orders (offer_id);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.handle_updated_at();

alter table public.orders enable row level security;

drop policy if exists "orders_select_parties" on public.orders;
create policy "orders_select_parties"
on public.orders
for select
to authenticated
using (
  buyer_id = auth.uid()
  or (auth.jwt()->>'email') = any(seller_emails)
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it')
);

drop policy if exists "orders_insert_parties" on public.orders;
create policy "orders_insert_parties"
on public.orders
for insert
to authenticated
with check (
  buyer_id = auth.uid()
  or (auth.jwt()->>'email') = any(seller_emails)
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it')
);

drop policy if exists "orders_update_parties" on public.orders;
create policy "orders_update_parties"
on public.orders
for update
to authenticated
using (
  buyer_id = auth.uid()
  or (auth.jwt()->>'email') = any(seller_emails)
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it')
)
with check (
  buyer_id = auth.uid()
  or (auth.jwt()->>'email') = any(seller_emails)
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it')
);

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin"
on public.orders
for delete
to authenticated
using (
  (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it')
);


-- FILE: supabase/migrations/20260409_support_tickets.sql

create table if not exists public.support_tickets (
  id text primary key,
  order_id text not null default '',
  order_number text not null default '',
  product_id text not null default '',
  product_title text not null default '',
  buyer_email text not null default '',
  seller_email text not null default '',
  requester_id uuid references auth.users(id) on delete set null,
  requester_email text not null default '',
  requester_role text not null default 'buyer',
  severity text not null default 'support',
  status text not null default 'open',
  reason text not null default 'other',
  message text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  context_snapshot jsonb not null default '{}'::jsonb,
  created_at_ms bigint not null default 0,
  updated_at_ms bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists support_tickets_order_idx on public.support_tickets (order_id);
create index if not exists support_tickets_requester_idx on public.support_tickets (requester_id);
create index if not exists support_tickets_status_idx on public.support_tickets (status);
create index if not exists support_tickets_created_idx on public.support_tickets (created_at_ms desc);
create index if not exists support_tickets_severity_idx on public.support_tickets (severity);

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.handle_updated_at();

alter table public.support_tickets enable row level security;

drop policy if exists "support_tickets_select_parties" on public.support_tickets;
create policy "support_tickets_select_parties"
on public.support_tickets
for select
to authenticated
using (
  requester_id = auth.uid()
  or (auth.jwt()->>'email') = buyer_email
  or (auth.jwt()->>'email') = seller_email
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
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
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
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
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
)
with check (
  requester_id = auth.uid()
  or (auth.jwt()->>'email') = buyer_email
  or (auth.jwt()->>'email') = seller_email
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
);


-- FILE: supabase/migrations/20260409_storage_listing_images.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "listing_images_public_read" on storage.objects;
create policy "listing_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'listing-images');

drop policy if exists "listing_images_owner_insert" on storage.objects;
create policy "listing_images_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "listing_images_owner_update" on storage.objects;
create policy "listing_images_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "listing_images_owner_delete" on storage.objects;
create policy "listing_images_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);


-- FILE: supabase/migrations/20260409_backend_commerce_core.sql

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


-- FILE: supabase/migrations/20260409_conversations_messages.sql

create table if not exists public.conversations (
  id text primary key,
  listing_id text,
  product_id text,
  seller_id text,
  seller_email text not null default '',
  seller_name text not null default '',
  buyer_id text,
  buyer_email text not null default '',
  buyer_name text not null default '',
  unread_count integer not null default 0,
  updated_at_ms bigint not null default 0,
  created_at_ms bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists conversations_listing_idx on public.conversations (listing_id);
create index if not exists conversations_product_idx on public.conversations (product_id);
create index if not exists conversations_buyer_email_idx on public.conversations (buyer_email);
create index if not exists conversations_seller_email_idx on public.conversations (seller_email);
create index if not exists conversations_updated_idx on public.conversations (updated_at_ms desc);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.handle_updated_at();

alter table public.conversations enable row level security;

drop policy if exists "conversations_select_parties" on public.conversations;
create policy "conversations_select_parties"
on public.conversations
for select
to authenticated
using (
  buyer_id = auth.uid()::text
  or seller_id = auth.uid()::text
  or (auth.jwt()->>'email') = buyer_email
  or (auth.jwt()->>'email') = seller_email
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
);

drop policy if exists "conversations_insert_parties" on public.conversations;
create policy "conversations_insert_parties"
on public.conversations
for insert
to authenticated
with check (
  buyer_id = auth.uid()::text
  or seller_id = auth.uid()::text
  or (auth.jwt()->>'email') = buyer_email
  or (auth.jwt()->>'email') = seller_email
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
);

drop policy if exists "conversations_update_parties" on public.conversations;
create policy "conversations_update_parties"
on public.conversations
for update
to authenticated
using (
  buyer_id = auth.uid()::text
  or seller_id = auth.uid()::text
  or (auth.jwt()->>'email') = buyer_email
  or (auth.jwt()->>'email') = seller_email
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
)
with check (
  buyer_id = auth.uid()::text
  or seller_id = auth.uid()::text
  or (auth.jwt()->>'email') = buyer_email
  or (auth.jwt()->>'email') = seller_email
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
);

drop policy if exists "conversations_delete_parties" on public.conversations;
create policy "conversations_delete_parties"
on public.conversations
for delete
to authenticated
using (
  buyer_id = auth.uid()::text
  or seller_id = auth.uid()::text
  or (auth.jwt()->>'email') = buyer_email
  or (auth.jwt()->>'email') = seller_email
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
);

create table if not exists public.conversation_messages (
  id text primary key,
  conversation_id text not null references public.conversations(id) on delete cascade,
  sender_role text not null default 'buyer',
  sender_email text not null default '',
  body text not null default '',
  sent_at_ms bigint not null default 0,
  time_label text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists conversation_messages_conversation_idx on public.conversation_messages (conversation_id);
create index if not exists conversation_messages_sent_idx on public.conversation_messages (sent_at_ms asc);
create index if not exists conversation_messages_sender_email_idx on public.conversation_messages (sender_email);

drop trigger if exists conversation_messages_set_updated_at on public.conversation_messages;
create trigger conversation_messages_set_updated_at
before update on public.conversation_messages
for each row execute function public.handle_updated_at();

alter table public.conversation_messages enable row level security;

drop policy if exists "conversation_messages_select_parties" on public.conversation_messages;
create policy "conversation_messages_select_parties"
on public.conversation_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (
        c.buyer_id = auth.uid()::text
        or c.seller_id = auth.uid()::text
        or (auth.jwt()->>'email') = c.buyer_email
        or (auth.jwt()->>'email') = c.seller_email
        or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
      )
  )
);

drop policy if exists "conversation_messages_insert_parties" on public.conversation_messages;
create policy "conversation_messages_insert_parties"
on public.conversation_messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (
        c.buyer_id = auth.uid()::text
        or c.seller_id = auth.uid()::text
        or (auth.jwt()->>'email') = c.buyer_email
        or (auth.jwt()->>'email') = c.seller_email
        or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
      )
  )
);

drop policy if exists "conversation_messages_update_parties" on public.conversation_messages;
create policy "conversation_messages_update_parties"
on public.conversation_messages
for update
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (
        c.buyer_id = auth.uid()::text
        or c.seller_id = auth.uid()::text
        or (auth.jwt()->>'email') = c.buyer_email
        or (auth.jwt()->>'email') = c.seller_email
        or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
      )
  )
)
with check (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (
        c.buyer_id = auth.uid()::text
        or c.seller_id = auth.uid()::text
        or (auth.jwt()->>'email') = c.buyer_email
        or (auth.jwt()->>'email') = c.seller_email
        or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
      )
  )
);

drop policy if exists "conversation_messages_delete_parties" on public.conversation_messages;
create policy "conversation_messages_delete_parties"
on public.conversation_messages
for delete
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (
        c.buyer_id = auth.uid()::text
        or c.seller_id = auth.uid()::text
        or (auth.jwt()->>'email') = c.buyer_email
        or (auth.jwt()->>'email') = c.seller_email
        or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
      )
  )
);


-- FILE: supabase/migrations/20260409_user_state_extensions.sql

create table if not exists public.favorites (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null default '',
  product_id text not null,
  created_at_ms bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists favorites_user_idx on public.favorites (user_id);
create index if not exists favorites_product_idx on public.favorites (product_id);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_owner" on public.favorites;
create policy "favorites_select_owner"
on public.favorites
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "favorites_insert_owner" on public.favorites;
create policy "favorites_insert_owner"
on public.favorites
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "favorites_delete_owner" on public.favorites;
create policy "favorites_delete_owner"
on public.favorites
for delete
to authenticated
using (user_id = auth.uid());

create table if not exists public.cart_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null default '',
  product_id text not null,
  qty integer not null default 1,
  updated_at_ms bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists cart_items_user_idx on public.cart_items (user_id);
create index if not exists cart_items_product_idx on public.cart_items (product_id);

drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.handle_updated_at();

alter table public.cart_items enable row level security;

drop policy if exists "cart_items_select_owner" on public.cart_items;
create policy "cart_items_select_owner"
on public.cart_items
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "cart_items_insert_owner" on public.cart_items;
create policy "cart_items_insert_owner"
on public.cart_items
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "cart_items_update_owner" on public.cart_items;
create policy "cart_items_update_owner"
on public.cart_items
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "cart_items_delete_owner" on public.cart_items;
create policy "cart_items_delete_owner"
on public.cart_items
for delete
to authenticated
using (user_id = auth.uid());

create table if not exists public.reviews (
  id text primary key,
  order_id text not null default '',
  product_id text not null default '',
  product_title text not null default '',
  seller_id text not null default '',
  seller_email text not null default '',
  buyer_id uuid references auth.users(id) on delete set null,
  buyer_email text not null default '',
  buyer_name text not null default '',
  rating integer not null default 5,
  body text not null default '',
  display_date text not null default '',
  created_at_ms bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists reviews_seller_email_idx on public.reviews (seller_email);
create index if not exists reviews_product_id_idx on public.reviews (product_id);
create index if not exists reviews_created_idx on public.reviews (created_at_ms desc);

alter table public.reviews enable row level security;

drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public"
on public.reviews
for select
to anon, authenticated
using (true);

drop policy if exists "reviews_insert_buyer" on public.reviews;
create policy "reviews_insert_buyer"
on public.reviews
for insert
to authenticated
with check (buyer_id = auth.uid());

drop policy if exists "reviews_update_buyer" on public.reviews;
create policy "reviews_update_buyer"
on public.reviews
for update
to authenticated
using (
  buyer_id = auth.uid()
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
)
with check (
  buyer_id = auth.uid()
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
);

drop policy if exists "reviews_delete_buyer" on public.reviews;
create policy "reviews_delete_buyer"
on public.reviews
for delete
to authenticated
using (
  buyer_id = auth.uid()
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
);

create table if not exists public.measurement_requests (
  id text primary key,
  listing_id text not null default '',
  requester_id uuid references auth.users(id) on delete set null,
  requester_email text not null default '',
  requester_name text not null default '',
  seller_email text not null default '',
  status text not null default 'open',
  created_at_ms bigint not null default 0,
  updated_at_ms bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists measurement_requests_listing_idx on public.measurement_requests (listing_id);
create index if not exists measurement_requests_requester_idx on public.measurement_requests (requester_id);
create index if not exists measurement_requests_seller_email_idx on public.measurement_requests (seller_email);

drop trigger if exists measurement_requests_set_updated_at on public.measurement_requests;
create trigger measurement_requests_set_updated_at
before update on public.measurement_requests
for each row execute function public.handle_updated_at();

alter table public.measurement_requests enable row level security;

drop policy if exists "measurement_requests_select_parties" on public.measurement_requests;
create policy "measurement_requests_select_parties"
on public.measurement_requests
for select
to authenticated
using (
  requester_id = auth.uid()
  or (auth.jwt()->>'email') = requester_email
  or (auth.jwt()->>'email') = seller_email
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
);

drop policy if exists "measurement_requests_insert_requester" on public.measurement_requests;
create policy "measurement_requests_insert_requester"
on public.measurement_requests
for insert
to authenticated
with check (
  requester_id = auth.uid()
  or (auth.jwt()->>'email') = requester_email
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
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
)
with check (
  requester_id = auth.uid()
  or (auth.jwt()->>'email') = requester_email
  or (auth.jwt()->>'email') = seller_email
  or (auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it')
);

create table if not exists public.notifications (
  id text primary key,
  recipient_id uuid references auth.users(id) on delete set null,
  recipient_email text not null default '',
  audience text not null default 'user',
  kind text not null default 'system',
  title text not null default 'IRIS',
  body text not null default '',
  link text not null default '',
  conversation_id text not null default '',
  order_id text not null default '',
  product_id text not null default '',
  scope text not null default '',
  unread boolean not null default true,
  created_at_ms bigint not null default 0,
  updated_at_ms bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists notifications_recipient_id_idx on public.notifications (recipient_id);
create index if not exists notifications_recipient_email_idx on public.notifications (recipient_email);
create index if not exists notifications_created_idx on public.notifications (created_at_ms desc);
create index if not exists notifications_unread_idx on public.notifications (unread);

drop trigger if exists notifications_set_updated_at on public.notifications;
create trigger notifications_set_updated_at
before update on public.notifications
for each row execute function public.handle_updated_at();

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_recipient" on public.notifications;
create policy "notifications_select_recipient"
on public.notifications
for select
to authenticated
using (
  recipient_id = auth.uid()
  or (auth.jwt()->>'email') = recipient_email
  or ((auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it') and audience = 'admin')
);

drop policy if exists "notifications_insert_authenticated" on public.notifications;
create policy "notifications_insert_authenticated"
on public.notifications
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "notifications_update_recipient" on public.notifications;
create policy "notifications_update_recipient"
on public.notifications
for update
to authenticated
using (
  recipient_id = auth.uid()
  or (auth.jwt()->>'email') = recipient_email
  or ((auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it') and audience = 'admin')
)
with check (
  recipient_id = auth.uid()
  or (auth.jwt()->>'email') = recipient_email
  or ((auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it') and audience = 'admin')
);

drop policy if exists "notifications_delete_recipient" on public.notifications;
create policy "notifications_delete_recipient"
on public.notifications
for delete
to authenticated
using (
  recipient_id = auth.uid()
  or (auth.jwt()->>'email') = recipient_email
  or ((auth.jwt()->>'email') in ('owner@iris-fashion.it', 'admin@iris-fashion.it', 'support@iris-fashion.it') and audience = 'admin')
);


