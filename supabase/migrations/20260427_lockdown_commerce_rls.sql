-- IRIS audit lockdown: remove direct party writes from commerce/chat state.

drop policy if exists "offers_select_parties" on public.offers;
create policy "offers_select_parties"
on public.offers
for select
to authenticated
using (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
  or public.is_iris_admin()
);

drop policy if exists "offers_update_parties" on public.offers;
drop policy if exists "offers_update_admin" on public.offers;
create policy "offers_update_admin"
on public.offers
for update
to authenticated
using (public.is_iris_admin())
with check (public.is_iris_admin());

drop policy if exists "offers_delete_parties" on public.offers;
drop policy if exists "offers_delete_admin" on public.offers;
create policy "offers_delete_admin"
on public.offers
for delete
to authenticated
using (public.is_iris_admin());

drop policy if exists "orders_insert_parties" on public.orders;
drop policy if exists "orders_insert_admin" on public.orders;
create policy "orders_insert_admin"
on public.orders
for insert
to authenticated
with check (public.is_iris_admin());

drop policy if exists "orders_update_parties" on public.orders;
drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin"
on public.orders
for update
to authenticated
using (public.is_iris_admin())
with check (public.is_iris_admin());

create or replace function public.enforce_conversation_party_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_email text := lower(coalesce(auth.jwt()->>'email', ''));
begin
  if public.is_iris_admin() then
    return new;
  end if;

  if not (
    old.buyer_id = auth.uid()::text
    or old.seller_id = auth.uid()::text
    or current_email = lower(coalesce(old.buyer_email, ''))
    or current_email = lower(coalesce(old.seller_email, ''))
  ) then
    raise exception 'Not allowed to update this conversation'
      using errcode = '42501';
  end if;

  if new.id is distinct from old.id
    or new.listing_id is distinct from old.listing_id
    or new.product_id is distinct from old.product_id
    or new.seller_id is distinct from old.seller_id
    or new.seller_email is distinct from old.seller_email
    or new.seller_name is distinct from old.seller_name
    or new.buyer_id is distinct from old.buyer_id
    or new.buyer_email is distinct from old.buyer_email
    or new.buyer_name is distinct from old.buyer_name
    or new.created_at_ms is distinct from old.created_at_ms then
    raise exception 'Conversation parties and listing context are immutable'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists conversations_party_update_scope_guard on public.conversations;
create trigger conversations_party_update_scope_guard
before update on public.conversations
for each row execute function public.enforce_conversation_party_update_scope();

drop policy if exists "conversations_update_parties" on public.conversations;
drop policy if exists "conversations_update_read_state_parties" on public.conversations;
create policy "conversations_update_read_state_parties"
on public.conversations
for update
to authenticated
using (
  buyer_id = auth.uid()::text
  or seller_id = auth.uid()::text
  or lower(auth.jwt()->>'email') = lower(buyer_email)
  or lower(auth.jwt()->>'email') = lower(seller_email)
  or public.is_iris_admin()
)
with check (
  buyer_id = auth.uid()::text
  or seller_id = auth.uid()::text
  or lower(auth.jwt()->>'email') = lower(buyer_email)
  or lower(auth.jwt()->>'email') = lower(seller_email)
  or public.is_iris_admin()
);

drop policy if exists "conversations_delete_parties" on public.conversations;
drop policy if exists "conversations_delete_admin" on public.conversations;
create policy "conversations_delete_admin"
on public.conversations
for delete
to authenticated
using (public.is_iris_admin());

drop policy if exists "conversation_messages_update_parties" on public.conversation_messages;
drop policy if exists "conversation_messages_update_admin" on public.conversation_messages;
create policy "conversation_messages_update_admin"
on public.conversation_messages
for update
to authenticated
using (public.is_iris_admin())
with check (public.is_iris_admin());

drop policy if exists "conversation_messages_delete_parties" on public.conversation_messages;
drop policy if exists "conversation_messages_delete_admin" on public.conversation_messages;
create policy "conversation_messages_delete_admin"
on public.conversation_messages
for delete
to authenticated
using (public.is_iris_admin());
