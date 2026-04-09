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
