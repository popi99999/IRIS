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
