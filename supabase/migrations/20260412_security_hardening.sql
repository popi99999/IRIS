-- ============================================================
-- IRIS Marketplace — Security hardening follow-up
-- Migration: 20260412_security_hardening.sql
-- ============================================================

-- Restrict seller payout metadata to the owner or IRIS admins.
drop policy if exists "seller_profiles_select_public" on public.seller_profiles;
drop policy if exists "seller_profiles_select_owner" on public.seller_profiles;
create policy "seller_profiles_select_owner"
on public.seller_profiles
for select
to authenticated
using (user_id = auth.uid() or public.is_iris_admin());

-- Tighten conversation RLS so users can only create/update threads
-- where their authenticated identity matches the side they control.
drop policy if exists "conversations_select_parties" on public.conversations;
create policy "conversations_select_parties"
on public.conversations
for select
to authenticated
using (
  public.is_iris_admin()
  or (buyer_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = buyer_email)
  or (seller_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = seller_email)
  or (buyer_id is null and coalesce(auth.jwt()->>'email', '') = buyer_email)
  or (seller_id is null and coalesce(auth.jwt()->>'email', '') = seller_email)
);

drop policy if exists "conversations_insert_parties" on public.conversations;
create policy "conversations_insert_parties"
on public.conversations
for insert
to authenticated
with check (
  public.is_iris_admin()
  or (buyer_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = buyer_email)
  or (seller_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = seller_email)
);

drop policy if exists "conversations_update_parties" on public.conversations;
create policy "conversations_update_parties"
on public.conversations
for update
to authenticated
using (
  public.is_iris_admin()
  or (buyer_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = buyer_email)
  or (seller_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = seller_email)
)
with check (
  public.is_iris_admin()
  or (buyer_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = buyer_email)
  or (seller_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = seller_email)
);

drop policy if exists "conversations_delete_parties" on public.conversations;
create policy "conversations_delete_parties"
on public.conversations
for delete
to authenticated
using (
  public.is_iris_admin()
  or (buyer_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = buyer_email)
  or (seller_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = seller_email)
);

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
        public.is_iris_admin()
        or (c.buyer_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = c.buyer_email)
        or (c.seller_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = c.seller_email)
        or (c.buyer_id is null and coalesce(auth.jwt()->>'email', '') = c.buyer_email)
        or (c.seller_id is null and coalesce(auth.jwt()->>'email', '') = c.seller_email)
      )
  )
);

drop policy if exists "conversation_messages_insert_parties" on public.conversation_messages;
create policy "conversation_messages_insert_parties"
on public.conversation_messages
for insert
to authenticated
with check (
  sender_email = coalesce(auth.jwt()->>'email', '')
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (
        public.is_iris_admin()
        or (c.buyer_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = c.buyer_email and sender_role = 'buyer')
        or (c.seller_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = c.seller_email and sender_role = 'seller')
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
        public.is_iris_admin()
        or (c.buyer_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = c.buyer_email)
        or (c.seller_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = c.seller_email)
      )
  )
)
with check (
  sender_email = coalesce(auth.jwt()->>'email', '')
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (
        public.is_iris_admin()
        or (c.buyer_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = c.buyer_email and sender_role = 'buyer')
        or (c.seller_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = c.seller_email and sender_role = 'seller')
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
        public.is_iris_admin()
        or (c.buyer_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = c.buyer_email)
        or (c.seller_id = auth.uid()::text and coalesce(auth.jwt()->>'email', '') = c.seller_email)
      )
  )
);
