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
