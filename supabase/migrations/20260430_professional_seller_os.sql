-- IRIS Professional Seller Operating System
-- Private B2B seller infrastructure, import/sync logging, and admin approval.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'professional_seller_status') then
    create type public.professional_seller_status as enum (
      'pending_verification',
      'approved',
      'rejected',
      'suspended'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'inventory_source_type') then
    create type public.inventory_source_type as enum (
      'google_sheets',
      'csv_feed',
      'manual_upload',
      'future_shopify',
      'future_woocommerce',
      'future_custom_api'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'inventory_source_status') then
    create type public.inventory_source_status as enum (
      'draft',
      'active',
      'paused',
      'error',
      'disabled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'import_job_status') then
    create type public.import_job_status as enum (
      'uploaded',
      'mapping_required',
      'preview_ready',
      'partial_success',
      'published',
      'saved_as_draft',
      'failed',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'import_row_status') then
    create type public.import_row_status as enum (
      'ready',
      'warning',
      'error',
      'published',
      'draft',
      'skipped'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'sync_log_status') then
    create type public.sync_log_status as enum (
      'success',
      'partial_success',
      'failed'
    );
  end if;
end $$;

create table if not exists public.professional_sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null default '',
  legal_name text not null,
  vat_number text not null,
  country text not null,
  business_address text not null,
  contact_name text not null,
  contact_phone text not null,
  website_url text,
  business_description text not null default '',
  status public.professional_seller_status not null default 'pending_verification',
  approved_at timestamptz,
  rejected_at timestamptz,
  suspended_at timestamptz,
  requested_more_info_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create index if not exists professional_sellers_user_id_idx on public.professional_sellers (user_id);
alter table public.professional_sellers add column if not exists user_email text not null default '';
create index if not exists professional_sellers_status_idx on public.professional_sellers (status);
create index if not exists professional_sellers_user_email_idx on public.professional_sellers (lower(user_email));
create index if not exists professional_sellers_vat_number_idx on public.professional_sellers (lower(vat_number));

create table if not exists public.seller_documents (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.professional_sellers(id) on delete cascade,
  document_type text not null default 'business_proof',
  file_url text not null,
  file_name text not null,
  storage_path text not null default '',
  uploaded_at timestamptz not null default timezone('utc', now()),
  verification_status text not null default 'pending',
  private_metadata jsonb not null default '{}'::jsonb
);

create index if not exists seller_documents_seller_id_idx on public.seller_documents (seller_id);

create table if not exists public.seller_verification_events (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.professional_sellers(id) on delete cascade,
  previous_status public.professional_seller_status,
  next_status public.professional_seller_status not null,
  action text not null,
  note text not null default '',
  requested_fields jsonb not null default '[]'::jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists seller_verification_events_seller_id_idx on public.seller_verification_events (seller_id, created_at desc);

create table if not exists public.inventory_sources (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.professional_sellers(id) on delete cascade,
  source_type public.inventory_source_type not null,
  source_url text,
  mapping_config jsonb not null default '{}'::jsonb,
  sync_frequency text not null default 'manual',
  missing_product_behavior text not null default 'disable',
  status public.inventory_source_status not null default 'draft',
  last_sync_at timestamptz,
  last_successful_sync_at timestamptz,
  last_error text,
  error_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint inventory_sources_missing_behavior_check check (
    missing_product_behavior in ('draft', 'disable', 'sold_out', 'archive', 'do_nothing')
  )
);

create index if not exists inventory_sources_seller_id_idx on public.inventory_sources (seller_id);
create index if not exists inventory_sources_status_idx on public.inventory_sources (status);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.professional_sellers(id) on delete cascade,
  inventory_source_id uuid references public.inventory_sources(id) on delete set null,
  source_type public.inventory_source_type not null default 'manual_upload',
  file_name text not null default '',
  file_size_bytes bigint not null default 0,
  status public.import_job_status not null default 'uploaded',
  mapping_config jsonb not null default '{}'::jsonb,
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  warning_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  duplicate_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create index if not exists import_jobs_seller_id_idx on public.import_jobs (seller_id, created_at desc);
create index if not exists import_jobs_inventory_source_id_idx on public.import_jobs (inventory_source_id);

create table if not exists public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.import_jobs(id) on delete cascade,
  seller_id uuid not null references public.professional_sellers(id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null default '{}'::jsonb,
  mapped_data jsonb not null default '{}'::jsonb,
  normalized_data jsonb not null default '{}'::jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  validation_warnings jsonb not null default '[]'::jsonb,
  duplicate_match jsonb not null default '{}'::jsonb,
  status public.import_row_status not null default 'ready',
  product_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists import_rows_job_row_number_idx on public.import_rows (import_job_id, row_number);
create index if not exists import_rows_seller_status_idx on public.import_rows (seller_id, status);

create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.professional_sellers(id) on delete cascade,
  inventory_source_id uuid references public.inventory_sources(id) on delete set null,
  sync_type text not null default 'manual_sync',
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  status public.sync_log_status not null default 'success',
  total_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  disabled_count integer not null default 0,
  skipped_count integer not null default 0,
  error_count integer not null default 0,
  warnings jsonb not null default '[]'::jsonb,
  error_details jsonb not null default '[]'::jsonb,
  file_name text not null default '',
  source_url text not null default '',
  triggered_by uuid references auth.users(id) on delete set null,
  triggered_by_role text not null default 'seller',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists sync_logs_seller_id_idx on public.sync_logs (seller_id, started_at desc);
create index if not exists sync_logs_inventory_source_id_idx on public.sync_logs (inventory_source_id, started_at desc);

create table if not exists public.seller_reports (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.professional_sellers(id) on delete cascade,
  report_type text not null,
  period_start date,
  period_end date,
  summary jsonb not null default '{}'::jsonb,
  file_url text,
  generated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists seller_reports_seller_id_idx on public.seller_reports (seller_id, created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text not null default '',
  actor_email text not null default '',
  seller_id uuid references public.professional_sellers(id) on delete set null,
  entity_type text not null default '',
  entity_id text not null default '',
  action text not null,
  before_value jsonb,
  after_value jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists audit_logs_seller_id_idx on public.audit_logs (seller_id, created_at desc);
create index if not exists audit_logs_actor_id_idx on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action, created_at desc);

alter table public.listings
  add column if not exists professional_seller_id uuid references public.professional_sellers(id) on delete set null,
  add column if not exists external_id text not null default '',
  add column if not exists sku text not null default '',
  add column if not exists source_id uuid references public.inventory_sources(id) on delete set null,
  add column if not exists source_item_id text not null default '',
  add column if not exists import_job_id uuid references public.import_jobs(id) on delete set null,
  add column if not exists validation_status text not null default 'ready',
  add column if not exists validation_errors jsonb not null default '[]'::jsonb,
  add column if not exists sync_fingerprint text not null default '';

create index if not exists listings_professional_seller_id_idx on public.listings (professional_seller_id);
create unique index if not exists listings_owner_external_id_unique
  on public.listings (owner_id, lower(external_id))
  where external_id <> '';
create unique index if not exists listings_owner_sku_unique
  on public.listings (owner_id, lower(sku))
  where sku <> '';
create unique index if not exists listings_owner_source_item_unique
  on public.listings (owner_id, source_id, lower(source_item_id))
  where source_id is not null and source_item_id <> '';

drop trigger if exists professional_sellers_set_updated_at on public.professional_sellers;
create trigger professional_sellers_set_updated_at
before update on public.professional_sellers
for each row execute function public.handle_updated_at();

drop trigger if exists inventory_sources_set_updated_at on public.inventory_sources;
create trigger inventory_sources_set_updated_at
before update on public.inventory_sources
for each row execute function public.handle_updated_at();

create or replace function public.current_professional_seller()
returns public.professional_sellers
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.professional_sellers
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_professional_seller_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.professional_sellers
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_approved_professional_seller(target_seller_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.professional_sellers ps
    where ps.id = target_seller_id
      and ps.user_id = auth.uid()
      and ps.status = 'approved'
  );
$$;

create or replace function public.can_user_write_listing(target_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    public.is_iris_admin()
    or (
      auth.uid() = target_owner
      and not exists (
        select 1
        from public.professional_sellers ps
        where ps.user_id = auth.uid()
          and ps.status = 'suspended'
      )
    )
  );
$$;

alter table public.professional_sellers enable row level security;
alter table public.seller_documents enable row level security;
alter table public.seller_verification_events enable row level security;
alter table public.inventory_sources enable row level security;
alter table public.import_jobs enable row level security;
alter table public.import_rows enable row level security;
alter table public.sync_logs enable row level security;
alter table public.seller_reports enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "professional_sellers_select_owner_admin" on public.professional_sellers;
create policy "professional_sellers_select_owner_admin"
on public.professional_sellers
for select
to authenticated
using (user_id = auth.uid() or public.is_iris_admin());

drop policy if exists "professional_sellers_insert_owner_pending" on public.professional_sellers;
create policy "professional_sellers_insert_owner_pending"
on public.professional_sellers
for insert
to authenticated
with check (user_id = auth.uid() and status = 'pending_verification');

drop policy if exists "professional_sellers_update_admin" on public.professional_sellers;
create policy "professional_sellers_update_admin"
on public.professional_sellers
for update
to authenticated
using (public.is_iris_admin())
with check (public.is_iris_admin());

drop policy if exists "seller_documents_select_owner_admin" on public.seller_documents;
create policy "seller_documents_select_owner_admin"
on public.seller_documents
for select
to authenticated
using (
  public.is_iris_admin()
  or exists (
    select 1 from public.professional_sellers ps
    where ps.id = seller_documents.seller_id
      and ps.user_id = auth.uid()
  )
);

drop policy if exists "seller_documents_insert_owner_pending" on public.seller_documents;
create policy "seller_documents_insert_owner_pending"
on public.seller_documents
for insert
to authenticated
with check (
  exists (
    select 1 from public.professional_sellers ps
    where ps.id = seller_documents.seller_id
      and ps.user_id = auth.uid()
      and ps.status in ('pending_verification', 'rejected')
  )
);

drop policy if exists "seller_documents_update_admin" on public.seller_documents;
create policy "seller_documents_update_admin"
on public.seller_documents
for update
to authenticated
using (public.is_iris_admin())
with check (public.is_iris_admin());

drop policy if exists "seller_verification_events_select_owner_admin" on public.seller_verification_events;
create policy "seller_verification_events_select_owner_admin"
on public.seller_verification_events
for select
to authenticated
using (
  public.is_iris_admin()
  or exists (
    select 1 from public.professional_sellers ps
    where ps.id = seller_verification_events.seller_id
      and ps.user_id = auth.uid()
  )
);

drop policy if exists "seller_verification_events_insert_admin" on public.seller_verification_events;
create policy "seller_verification_events_insert_admin"
on public.seller_verification_events
for insert
to authenticated
with check (public.is_iris_admin());

drop policy if exists "inventory_sources_owner_approved_select_admin" on public.inventory_sources;
create policy "inventory_sources_owner_approved_select_admin"
on public.inventory_sources
for select
to authenticated
using (public.is_iris_admin() or public.is_approved_professional_seller(seller_id));

drop policy if exists "inventory_sources_owner_approved_insert" on public.inventory_sources;
create policy "inventory_sources_owner_approved_insert"
on public.inventory_sources
for insert
to authenticated
with check (public.is_approved_professional_seller(seller_id));

drop policy if exists "inventory_sources_owner_approved_update_admin" on public.inventory_sources;
create policy "inventory_sources_owner_approved_update_admin"
on public.inventory_sources
for update
to authenticated
using (public.is_iris_admin() or public.is_approved_professional_seller(seller_id))
with check (public.is_iris_admin() or public.is_approved_professional_seller(seller_id));

drop policy if exists "import_jobs_owner_approved_select_admin" on public.import_jobs;
create policy "import_jobs_owner_approved_select_admin"
on public.import_jobs
for select
to authenticated
using (public.is_iris_admin() or public.is_approved_professional_seller(seller_id));

drop policy if exists "import_jobs_owner_approved_insert" on public.import_jobs;
create policy "import_jobs_owner_approved_insert"
on public.import_jobs
for insert
to authenticated
with check (public.is_approved_professional_seller(seller_id));

drop policy if exists "import_jobs_owner_approved_update_admin" on public.import_jobs;
create policy "import_jobs_owner_approved_update_admin"
on public.import_jobs
for update
to authenticated
using (public.is_iris_admin() or public.is_approved_professional_seller(seller_id))
with check (public.is_iris_admin() or public.is_approved_professional_seller(seller_id));

drop policy if exists "import_rows_owner_approved_select_admin" on public.import_rows;
create policy "import_rows_owner_approved_select_admin"
on public.import_rows
for select
to authenticated
using (public.is_iris_admin() or public.is_approved_professional_seller(seller_id));

drop policy if exists "import_rows_owner_approved_insert" on public.import_rows;
create policy "import_rows_owner_approved_insert"
on public.import_rows
for insert
to authenticated
with check (public.is_approved_professional_seller(seller_id));

drop policy if exists "import_rows_owner_approved_update_admin" on public.import_rows;
create policy "import_rows_owner_approved_update_admin"
on public.import_rows
for update
to authenticated
using (public.is_iris_admin() or public.is_approved_professional_seller(seller_id))
with check (public.is_iris_admin() or public.is_approved_professional_seller(seller_id));

drop policy if exists "sync_logs_owner_approved_select_admin" on public.sync_logs;
create policy "sync_logs_owner_approved_select_admin"
on public.sync_logs
for select
to authenticated
using (public.is_iris_admin() or public.is_approved_professional_seller(seller_id));

drop policy if exists "sync_logs_owner_approved_insert" on public.sync_logs;
create policy "sync_logs_owner_approved_insert"
on public.sync_logs
for insert
to authenticated
with check (public.is_iris_admin() or public.is_approved_professional_seller(seller_id));

drop policy if exists "seller_reports_owner_approved_select_admin" on public.seller_reports;
create policy "seller_reports_owner_approved_select_admin"
on public.seller_reports
for select
to authenticated
using (public.is_iris_admin() or public.is_approved_professional_seller(seller_id));

drop policy if exists "seller_reports_owner_approved_insert_admin" on public.seller_reports;
create policy "seller_reports_owner_approved_insert_admin"
on public.seller_reports
for insert
to authenticated
with check (public.is_iris_admin() or public.is_approved_professional_seller(seller_id));

drop policy if exists "audit_logs_select_related_admin" on public.audit_logs;
create policy "audit_logs_select_related_admin"
on public.audit_logs
for select
to authenticated
using (
  public.is_iris_admin()
  or actor_id = auth.uid()
  or exists (
    select 1 from public.professional_sellers ps
    where ps.id = audit_logs.seller_id
      and ps.user_id = auth.uid()
  )
);

drop policy if exists "audit_logs_insert_authenticated" on public.audit_logs;
create policy "audit_logs_insert_authenticated"
on public.audit_logs
for insert
to authenticated
with check (actor_id = auth.uid() or public.is_iris_admin());

drop policy if exists "Owners can insert their listings" on public.listings;
create policy "Owners can insert their listings"
on public.listings
for insert
to authenticated
with check (public.can_user_write_listing(owner_id));

drop policy if exists "Owners can update their listings" on public.listings;
create policy "Owners can update their listings"
on public.listings
for update
to authenticated
using (public.can_user_write_listing(owner_id))
with check (public.can_user_write_listing(owner_id));

drop policy if exists "Owners can delete their listings" on public.listings;
create policy "Owners can delete their listings"
on public.listings
for delete
to authenticated
using (public.can_user_write_listing(owner_id));

insert into storage.buckets (id, name, public)
values ('seller-documents', 'seller-documents', false)
on conflict (id) do nothing;

drop policy if exists "seller_documents_storage_owner_insert" on storage.objects;
create policy "seller_documents_storage_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'seller-documents'
  and exists (
    select 1
    from public.professional_sellers ps
    where ps.user_id = auth.uid()
      and name like ps.id::text || '/%'
  )
);

drop policy if exists "seller_documents_storage_owner_select" on storage.objects;
create policy "seller_documents_storage_owner_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'seller-documents'
  and (
    public.is_iris_admin()
    or exists (
      select 1
      from public.professional_sellers ps
      where ps.user_id = auth.uid()
        and name like ps.id::text || '/%'
    )
  )
);

create or replace function public.audit_professional_seller_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.seller_verification_events (
      seller_id,
      previous_status,
      next_status,
      action,
      actor_id,
      actor_email
    ) values (
      new.id,
      old.status,
      new.status,
      'status_changed',
      auth.uid(),
      lower(coalesce(auth.jwt()->>'email', ''))
    );

    insert into public.audit_logs (
      actor_id,
      actor_role,
      actor_email,
      seller_id,
      entity_type,
      entity_id,
      action,
      before_value,
      after_value
    ) values (
      auth.uid(),
      case when public.is_iris_admin() then 'admin' else 'unknown' end,
      lower(coalesce(auth.jwt()->>'email', '')),
      new.id,
      'professional_seller',
      new.id::text,
      'seller_' || new.status::text,
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists professional_seller_status_audit on public.professional_sellers;
create trigger professional_seller_status_audit
after update on public.professional_sellers
for each row execute function public.audit_professional_seller_status();
