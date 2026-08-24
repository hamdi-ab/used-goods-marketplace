-- Extend notification types to cover business lead
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'offer_received',
      'offer_accepted',
      'offer_declined',
      'offer_countered',
      'offer_counter_accepted',
      'offer_counter_declined',
      'review_received',
      'report_resolved',
      'business_lead'
    )
  );

-- Business tier lead capture (T27 extension). High-intent sellers who want
-- the Business tier (storefront, multi-user, custom capacity) land here
-- instead of a fixed price — Business pricing is custom, so we capture the
-- lead and follow up. The same Chapa integration handles both tiers; Business
-- just needs a custom plan.

create table if not exists public.business_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  company text,
  needs text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint business_leads_status_check check (status in ('new', 'contacted', 'closed'))
);

create index if not exists business_leads_status_idx on public.business_leads (status);
create index if not exists business_leads_created_idx on public.business_leads (created_at desc);

alter table public.business_leads enable row level security;

-- Leads are insertable by the lead submitter; readable by admins.
create policy "business_leads are insertable by anyone"
  on business_leads for insert
  to authenticated, anon
  with check (true);

create policy "business_leads are readable by admins"
  on business_leads for select
  to authenticated
  using (public.is_admin());

create policy "business_leads are updateable by admins"
  on business_leads for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant insert on table business_leads to authenticated, anon;
grant select, update on table business_leads to authenticated;

-- Notification trigger: new business lead → admins get notified.
create or replace function public.notify_business_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
begin
  for v_admin_id in
    select id from public.profiles where role = 'admin'
  loop
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      v_admin_id,
      'business_lead',
      'New Business lead',
      'A seller requested Business tier info: ' || new.name || ' (' || new.email || ')',
      jsonb_build_object('lead_id', new.id, 'email', new.email, 'name', new.name)
    );
  end loop;
  return new;
end;
$$;

create trigger notifications_business_lead
  after insert on public.business_leads
  for each row execute function public.notify_business_lead();

-- Submit business lead RPC. SECURITY DEFINER so anon can submit.
create or replace function public.submit_business_lead(
  p_name text,
  p_email text,
  p_phone text default null,
  p_company text default null,
  p_needs text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_name is null or trim(p_name) = '' then
    return jsonb_build_object('ok', false, 'error', 'Name is required');
  end if;
  if p_email is null or trim(p_email) !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    return jsonb_build_object('ok', false, 'error', 'Enter a valid email');
  end if;

  insert into public.business_leads (user_id, name, email, phone, company, needs)
  values (
    (select auth.uid()),
    trim(p_name),
    trim(p_email),
    nullif(trim(p_phone), ''),
    nullif(trim(p_company), ''),
    nullif(trim(p_needs), '')
  );

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

grant execute on function public.submit_business_lead(text, text, text, text, text) to authenticated, anon;
