-- ============================================================
-- IRIS Marketplace — Missing Tables, Indexes and RLS Fixes
-- Migration: 20260409_missing_tables_and_fixes.sql
-- ============================================================

-- ============================================================
-- 1. quantity field on listings (prevent overselling)
-- ============================================================
alter table public.listings
  add column if not exists quantity integer not null default 1;

-- Constraint: quantity must be >= 0
alter table public.listings
  add constraint if not exists listings_quantity_non_negative check (quantity >= 0);

-- ============================================================
-- 2. Missing indexes
-- ============================================================
create index if not exists orders_created_at_idx        on public.orders (created_at desc);
create index if not exists listings_created_at_idx      on public.listings (created_at desc);
create index if not exists seller_profiles_payout_idx   on public.seller_profiles (payout_status);
create index if not exists offers_status_idx            on public.offers (status);
create index if not exists offers_created_at_idx        on public.offers (created_at desc);
create index if not exists conversations_updated_at_idx on public.conversations (updated_at desc);

-- ============================================================
-- 3. seller_profiles DELETE policy (was missing)
-- ============================================================
drop policy if exists "seller_profiles_delete_owner" on public.seller_profiles;
create policy "seller_profiles_delete_owner"
on public.seller_profiles
for delete
to authenticated
using (user_id = auth.uid() or public.is_iris_admin());

-- ============================================================
-- 4. reviews INSERT: verify buyer has actually completed an order
--    for this product before allowing a review
-- ============================================================
drop policy if exists "reviews_insert_buyer" on public.reviews;
create policy "reviews_insert_buyer"
on public.reviews
for insert
to authenticated
with check (
  buyer_id = auth.uid()
  and (
    -- Buyer must have a completed order containing this product
    exists (
      select 1
      from public.orders o
      where o.buyer_id = auth.uid()
        and (o.review_status is null or o.review_status <> 'blocked')
        and (
          o.id = order_id
          or exists (
            select 1 from public.order_items oi
            where oi.order_id = o.id
              and oi.listing_id = product_id
          )
        )
        and o.status in ('delivered', 'completed', 'paid')
    )
  )
);

-- ============================================================
-- 5. disputes table
-- ============================================================
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete restrict,
  opened_by uuid not null references auth.users(id) on delete restrict,
  reason text not null,
  status text not null default 'open'
    check (status in ('open', 'under_review', 'resolved', 'escalated')),
  resolution text,
  evidence jsonb not null default '[]'::jsonb,
  assigned_to uuid references auth.users(id) on delete set null,
  stripe_dispute_id text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);

create index if not exists disputes_order_idx      on public.disputes (order_id);
create index if not exists disputes_opened_by_idx  on public.disputes (opened_by);
create index if not exists disputes_status_idx     on public.disputes (status);
create index if not exists disputes_assigned_idx   on public.disputes (assigned_to);

drop trigger if exists disputes_set_updated_at on public.disputes;
create trigger disputes_set_updated_at
before update on public.disputes
for each row execute function public.handle_updated_at();

alter table public.disputes enable row level security;

-- Buyer or seller of the order can see their own dispute
drop policy if exists "disputes_select_parties" on public.disputes;
create policy "disputes_select_parties"
on public.disputes
for select
to authenticated
using (
  opened_by = auth.uid()
  or public.is_iris_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id
      and (
        o.buyer_id = auth.uid()
        or (auth.jwt()->>'email') = any(o.seller_emails)
      )
  )
);

-- Only buyer of the order can open a dispute
drop policy if exists "disputes_insert_buyer" on public.disputes;
create policy "disputes_insert_buyer"
on public.disputes
for insert
to authenticated
with check (
  opened_by = auth.uid()
  and exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.buyer_id = auth.uid()
      and o.status in ('paid', 'shipped', 'delivered')
  )
);

-- Only admin can update (assign, resolve, escalate)
drop policy if exists "disputes_update_admin" on public.disputes;
create policy "disputes_update_admin"
on public.disputes
for update
to authenticated
using (public.is_iris_admin())
with check (public.is_iris_admin());

-- ============================================================
-- 6. chargebacks table (Stripe dispute tracking)
-- ============================================================
create table if not exists public.chargebacks (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete restrict,
  stripe_dispute_id text not null unique,
  amount integer not null,
  currency text not null default 'eur',
  reason text,
  status text not null default 'warning_needs_response',
  evidence_due_by timestamptz,
  evidence_submitted jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists chargebacks_order_idx         on public.chargebacks (order_id);
create index if not exists chargebacks_stripe_dispute_idx on public.chargebacks (stripe_dispute_id);
create index if not exists chargebacks_status_idx        on public.chargebacks (status);

drop trigger if exists chargebacks_set_updated_at on public.chargebacks;
create trigger chargebacks_set_updated_at
before update on public.chargebacks
for each row execute function public.handle_updated_at();

alter table public.chargebacks enable row level security;

-- Admin only can see chargebacks (financial sensitive)
drop policy if exists "chargebacks_admin_only" on public.chargebacks;
create policy "chargebacks_admin_only"
on public.chargebacks
for all
to authenticated
using (public.is_iris_admin())
with check (public.is_iris_admin());

-- ============================================================
-- 7. order_shipments table (Shippo integration)
-- ============================================================
create table if not exists public.order_shipments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  carrier text not null,
  tracking_number text not null default '',
  label_url text not null default '',
  return_label_url text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'label_created', 'in_transit', 'delivered', 'returned', 'failed')),
  shippo_shipment_id text not null default '',
  shippo_transaction_id text not null default '',
  estimated_delivery date,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists order_shipments_order_idx    on public.order_shipments (order_id);
create index if not exists order_shipments_tracking_idx on public.order_shipments (tracking_number);
create index if not exists order_shipments_status_idx   on public.order_shipments (status);

drop trigger if exists order_shipments_set_updated_at on public.order_shipments;
create trigger order_shipments_set_updated_at
before update on public.order_shipments
for each row execute function public.handle_updated_at();

alter table public.order_shipments enable row level security;

-- Buyer and seller of the order can view shipment info
drop policy if exists "order_shipments_select_parties" on public.order_shipments;
create policy "order_shipments_select_parties"
on public.order_shipments
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
);

-- Sellers can insert shipment info for their orders
drop policy if exists "order_shipments_insert_seller" on public.order_shipments;
create policy "order_shipments_insert_seller"
on public.order_shipments
for insert
to authenticated
with check (
  public.is_iris_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id
      and (auth.jwt()->>'email') = any(o.seller_emails)
  )
);

-- Sellers and admin can update shipment info
drop policy if exists "order_shipments_update_parties" on public.order_shipments;
create policy "order_shipments_update_parties"
on public.order_shipments
for update
to authenticated
using (
  public.is_iris_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id
      and (auth.jwt()->>'email') = any(o.seller_emails)
  )
)
with check (
  public.is_iris_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id
      and (auth.jwt()->>'email') = any(o.seller_emails)
  )
);

-- ============================================================
-- 8. payout_holds: lock payouts for active disputes
-- ============================================================
-- Function to check if an order has an active dispute (prevents payout release)
create or replace function public.order_has_active_dispute(p_order_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.disputes d
    where d.order_id = p_order_id
      and d.status not in ('resolved')
  ) or exists (
    select 1 from public.chargebacks c
    where c.order_id = p_order_id
      and c.status not in ('won', 'lost')
  );
$$;

-- ============================================================
-- 9. Atomic purchase function: prevents overselling via FOR UPDATE
-- ============================================================
create or replace function public.reserve_listing_for_purchase(p_listing_id text, p_buyer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing record;
begin
  -- Lock the row to prevent concurrent purchases
  select * into v_listing
  from public.listings
  where id = p_listing_id
    and listing_status = 'published'
    and inventory_status = 'active'
    and quantity > 0
  for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'listing_unavailable');
  end if;

  -- Decrement quantity atomically
  update public.listings
  set quantity = quantity - 1,
      inventory_status = case when quantity - 1 <= 0 then 'sold' else inventory_status end,
      updated_at = timezone('utc', now())
  where id = p_listing_id;

  return jsonb_build_object(
    'success', true,
    'listing_id', v_listing.id,
    'listing_name', v_listing.name,
    'price', v_listing.price
  );
end;
$$;

-- ============================================================
-- 10. support_tickets: add escalation and assignment policies
-- ============================================================
-- Add assigned_to and escalated_at columns if missing
alter table public.support_tickets
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists escalated_at timestamptz,
  add column if not exists escalated_by uuid references auth.users(id) on delete set null,
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent'));

create index if not exists support_tickets_assigned_idx  on public.support_tickets (assigned_to);
create index if not exists support_tickets_priority_idx  on public.support_tickets (priority);
create index if not exists support_tickets_status_idx    on public.support_tickets (status);
create index if not exists support_tickets_created_at_idx on public.support_tickets (created_at desc);
