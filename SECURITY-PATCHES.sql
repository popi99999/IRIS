-- ============================================================
-- IRIS Security Patches — da eseguire nel Supabase SQL Editor
-- Applicare in ordine. Sicuro da rieseguire (idempotente).
-- ============================================================

-- ============================================================
-- PATCH 1: handle_new_user — blocca role escalation via signup
-- Prima era: coalesce(raw_user_meta_data->>'role', 'buyer')
-- Ora: allowlist rigoroso, solo 'buyer' o 'seller' accettati
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    member_since
  )
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    case when new.raw_user_meta_data ->> 'role' in ('buyer', 'seller')
         then new.raw_user_meta_data ->> 'role'
         else 'buyer'
    end,
    to_char(timezone('utc', now()), 'YYYY')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = case when excluded.full_name <> '' then excluded.full_name else public.profiles.full_name end,
    phone = case when excluded.phone <> '' then excluded.phone else public.profiles.phone end,
    role = case
             when excluded.role in ('buyer', 'seller') and excluded.role <> ''
             then excluded.role
             else public.profiles.role
           end;

  return new;
end;
$$;

-- ============================================================
-- PATCH 2: reserve_listing_for_purchase — blocca DoS da qualsiasi utente
-- Aggiunge check: p_buyer_id deve corrispondere all'utente autenticato
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
  -- Security: verify the caller is the stated buyer
  if p_buyer_id <> auth.uid() then
    raise exception 'unauthorized: p_buyer_id does not match authenticated user';
  end if;

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
-- PATCH 3: notifications INSERT — blocca invio notifiche a utenti arbitrari
-- Prima: with check (auth.uid() is not null)  → sempre true per tutti
-- Ora: solo notifiche a se stessi; le notifiche cross-user vengono
--      create dalle Edge Functions via service role (bypassa RLS)
-- ============================================================
drop policy if exists "notifications_insert_authenticated" on public.notifications;
create policy "notifications_insert_authenticated"
on public.notifications
for insert
to authenticated
with check (
  recipient_id = auth.uid()
  or (auth.jwt()->>'email') = recipient_email
);

-- Verifica applicazione patch
do $$
begin
  raise notice 'IRIS Security Patches applied successfully at %', now();
end;
$$;
