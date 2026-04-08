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
