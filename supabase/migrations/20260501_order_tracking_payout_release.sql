-- ============================================================
-- IRIS order tracking, buyer confirmation and payout release
-- ============================================================

alter table public.orders
  add column if not exists payout_status text not null default '',
  add column if not exists issue_status text not null default '',
  add column if not exists authentication_status text not null default '',
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists buyer_confirmed_at timestamptz,
  add column if not exists last_tracking_status text not null default '',
  add column if not exists estimated_delivery_at timestamptz,
  add column if not exists checkout_session_id text not null default '',
  add column if not exists payment_intent_id text not null default '',
  add column if not exists transfer_group text not null default '';

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  seller_id uuid references auth.users(id) on delete set null,
  buyer_id uuid references auth.users(id) on delete set null,
  carrier text not null default '',
  carrier_service text not null default '',
  tracking_number text not null default '',
  tracking_url text not null default '',
  provider text not null default 'manual',
  provider_shipment_id text not null default '',
  provider_tracking_id text not null default '',
  shipping_flow text not null default 'direct_to_buyer'
    check (shipping_flow in ('direct_to_buyer', 'seller_to_iris_to_buyer', 'iris_to_buyer')),
  status text not null default 'label_created'
    check (status in (
      'label_created',
      'accepted_by_carrier',
      'shipped',
      'in_transit',
      'arrived_at_facility',
      'out_for_delivery',
      'delivery_attempted',
      'delivered',
      'exception',
      'returned_to_sender',
      'unknown'
    )),
  raw_status text not null default '',
  estimated_delivery_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  last_event_at timestamptz,
  raw_carrier_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists shipments_order_tracking_unique_idx
  on public.shipments (order_id, carrier, tracking_number)
  where tracking_number <> '';
create index if not exists shipments_order_idx on public.shipments (order_id);
create index if not exists shipments_seller_idx on public.shipments (seller_id, created_at desc);
create index if not exists shipments_status_idx on public.shipments (status, last_event_at desc);

drop trigger if exists shipments_set_updated_at on public.shipments;
create trigger shipments_set_updated_at
before update on public.shipments
for each row execute function public.handle_updated_at();

create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.shipments(id) on delete cascade,
  order_id text not null references public.orders(id) on delete cascade,
  carrier text not null default '',
  tracking_number text not null default '',
  normalized_status text not null default 'unknown',
  raw_status text not null default '',
  description text not null default '',
  location text not null default '',
  occurred_at timestamptz not null default timezone('utc', now()),
  received_at timestamptz not null default timezone('utc', now()),
  raw_payload jsonb not null default '{}'::jsonb,
  source text not null default 'manual',
  provider_event_id text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists tracking_events_provider_event_unique_idx
  on public.tracking_events (provider_event_id)
  where provider_event_id <> '';
create index if not exists tracking_events_order_idx on public.tracking_events (order_id, occurred_at desc);
create index if not exists tracking_events_shipment_idx on public.tracking_events (shipment_id, occurred_at desc);

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text not null default '',
  previous_status text not null default '',
  new_status text not null default '',
  message text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists order_status_events_order_idx on public.order_status_events (order_id, created_at desc);
create index if not exists order_status_events_actor_idx on public.order_status_events (actor_id, created_at desc);

alter table public.payout_releases
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists seller_id uuid references auth.users(id) on delete set null,
  add column if not exists buyer_id uuid references auth.users(id) on delete set null,
  add column if not exists provider_payment_id text not null default '',
  add column if not exists provider_payout_id text not null default '',
  add column if not exists amount numeric(12,2) not null default 0,
  add column if not exists release_reason text not null default '',
  add column if not exists released_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists failure_reason text not null default '',
  add column if not exists triggered_by uuid references auth.users(id) on delete set null,
  add column if not exists triggered_by_role text not null default '',
  add column if not exists release_attempt_count integer not null default 0,
  add column if not exists blocked_reason text not null default '';

create unique index if not exists payout_releases_id_unique_idx on public.payout_releases (id);

create table if not exists public.order_issues (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  buyer_id uuid references auth.users(id) on delete set null,
  seller_id uuid references auth.users(id) on delete set null,
  issue_type text not null
    check (issue_type in (
      'item_not_received',
      'item_damaged',
      'item_not_as_described',
      'wrong_item',
      'authentication_concern',
      'other'
    )),
  message text not null default '',
  status text not null default 'open'
    check (status in ('open', 'under_review', 'resolved', 'closed')),
  payout_blocked boolean not null default true,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists order_issues_order_idx on public.order_issues (order_id, created_at desc);
create index if not exists order_issues_status_idx on public.order_issues (status, created_at desc);

drop trigger if exists order_issues_set_updated_at on public.order_issues;
create trigger order_issues_set_updated_at
before update on public.order_issues
for each row execute function public.handle_updated_at();

create table if not exists public.tracking_webhook_events (
  id text primary key,
  carrier text not null default '',
  tracking_number text not null default '',
  status text not null default 'processing',
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  last_error text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists tracking_webhook_events_set_updated_at on public.tracking_webhook_events;
create trigger tracking_webhook_events_set_updated_at
before update on public.tracking_webhook_events
for each row execute function public.handle_updated_at();

create or replace function public.order_is_party(p_order_id text)
returns boolean
language sql
stable
as $$
  select public.is_iris_admin()
    or exists (
      select 1
      from public.orders o
      where o.id = p_order_id
        and (
          o.buyer_id = auth.uid()
          or (auth.jwt()->>'email') = any(o.seller_emails)
        )
    );
$$;

alter table public.shipments enable row level security;
alter table public.tracking_events enable row level security;
alter table public.order_status_events enable row level security;
alter table public.order_issues enable row level security;
alter table public.tracking_webhook_events enable row level security;

drop policy if exists "shipments_select_parties_admin" on public.shipments;
create policy "shipments_select_parties_admin"
on public.shipments
for select
to authenticated
using (public.order_is_party(order_id));

drop policy if exists "shipments_insert_seller_admin" on public.shipments;
create policy "shipments_insert_seller_admin"
on public.shipments
for insert
to authenticated
with check (
  public.is_iris_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id
      and (auth.jwt()->>'email') = any(o.seller_emails)
      and coalesce(o.status, '') not in ('delivered', 'awaiting_buyer_confirmation', 'buyer_confirmed_ok', 'payout_pending', 'payout_released', 'payout_paid', 'completed')
  )
);

drop policy if exists "shipments_update_seller_before_delivery_admin" on public.shipments;
create policy "shipments_update_seller_before_delivery_admin"
on public.shipments
for update
to authenticated
using (
  public.is_iris_admin()
  or (
    status <> 'delivered'
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and (auth.jwt()->>'email') = any(o.seller_emails)
    )
  )
)
with check (
  public.is_iris_admin()
  or (
    status <> 'delivered'
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and (auth.jwt()->>'email') = any(o.seller_emails)
    )
  )
);

drop policy if exists "tracking_events_select_parties_admin" on public.tracking_events;
create policy "tracking_events_select_parties_admin"
on public.tracking_events
for select
to authenticated
using (public.order_is_party(order_id));

drop policy if exists "order_status_events_select_parties_admin" on public.order_status_events;
create policy "order_status_events_select_parties_admin"
on public.order_status_events
for select
to authenticated
using (public.order_is_party(order_id));

drop policy if exists "order_issues_select_parties_admin" on public.order_issues;
create policy "order_issues_select_parties_admin"
on public.order_issues
for select
to authenticated
using (public.order_is_party(order_id));

drop policy if exists "order_issues_insert_buyer" on public.order_issues;
create policy "order_issues_insert_buyer"
on public.order_issues
for insert
to authenticated
with check (
  buyer_id = auth.uid()
  and exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.buyer_id = auth.uid()
      and coalesce(o.status, '') in ('delivered', 'awaiting_buyer_confirmation', 'buyer_confirmed_ok', 'shipped', 'in_transit', 'out_for_delivery')
  )
);

drop policy if exists "order_issues_update_admin" on public.order_issues;
create policy "order_issues_update_admin"
on public.order_issues
for update
to authenticated
using (public.is_iris_admin())
with check (public.is_iris_admin());

drop policy if exists "tracking_webhook_events_admin_only" on public.tracking_webhook_events;
create policy "tracking_webhook_events_admin_only"
on public.tracking_webhook_events
for all
to authenticated
using (public.is_iris_admin())
with check (public.is_iris_admin());

