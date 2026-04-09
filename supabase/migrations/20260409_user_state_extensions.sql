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
