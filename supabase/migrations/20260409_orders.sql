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
