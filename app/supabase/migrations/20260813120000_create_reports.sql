-- T11 - Reports & admin moderation
-- reports: users report listings or sellers; an admin review queue processes them
-- and can remove content or block a seller. Per docs/02-architecture/03-database-design-specification.md
-- §20 (RLS: reporter reads own, admin full access), §22 (migration naming), §18
-- (constraints), and the T11 acceptance criteria.
--
-- Submission is rate-limited by the submit_report RPC (SECURITY DEFINER) so a
-- caller cannot bypass it with a raw INSERT. Admin resolution is likewise an RPC
-- so a single action atomically closes the report and applies the moderation
-- verdict to the targeted listing/seller.

create type if not exists public.report_reason as enum (
  'spam', 'fraud', 'duplicate', 'wrong_category', 'offensive_content', 'other'
);

create type if not exists public.report_status as enum (
  'open', 'resolved', 'rejected'
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_listing_id uuid references public.listings (id) on delete cascade,
  reported_seller_id uuid references public.profiles (id) on delete cascade,
  reason public.report_reason not null,
  note text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A report must target exactly one of listing or seller.
  constraint reports_target_one check (
    (reported_listing_id is not null)::integer + (reported_seller_id is not null)::integer = 1
  ),
  constraint reports_note_length check (
    note is null or char_length(note) between 1 and 1000
  )
);

create index if not exists reports_reporter_id_idx on public.reports (reporter_id);
create index if not exists reports_listing_id_idx on public.reports (reported_listing_id);
create index if not exists reports_seller_id_idx on public.reports (reported_seller_id);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_created_at_idx on public.reports (created_at);

create trigger if not exists reports_set_updated_at
  before update on public.reports
  for each row execute function public.handle_updated_at();

------------------------------------------------------------------------------
-- RLS (T11 AC): a user sees only their own reports; an admin sees all.
-- No one else can read a report (reasons/notes never leak to other users).
------------------------------------------------------------------------------
alter table public.reports enable row level security;

create policy if not exists "Reports are readable by the reporter"
  on public.reports for select
  to authenticated
  using ((select auth.uid()) = reporter_id);

create policy if not exists "Reports are readable by admins"
  on public.reports for select
  to authenticated
  using (public.is_admin());

create policy if not exists "Reports are manageable by admins"
  on public.reports for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Inserts are never direct: the submit_report RPC enforces the rate limit and
-- the "exactly one target" rule is already covered by the table constraint.
revoke all on public.reports from public;
grant usage on schema public to authenticated;
grant select on public.reports to authenticated;

------------------------------------------------------------------------------
-- submit_report RPC (SECURITY DEFINER).
-- Enforces rate limiting (max REPORT_RATE_LIMIT_COUNT submissions per reporter
-- per target within REPORT_RATE_LIMIT_WINDOW seconds) and inserts the row.
-- Returns jsonb { ok, error } so the caller gets a single result.
------------------------------------------------------------------------------
create or replace function public.submit_report(
  p_listing_id uuid default null,
  p_seller_id uuid default null,
  p_reason public.report_reason,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reporter uuid;
  v_recent integer;
begin
  -- Resolve the reporter from the session, never trust the caller-supplied id.
  v_reporter := auth.uid();

  if v_reporter is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  -- A report targets exactly one of listing or seller.
  if (p_listing_id is not null)::integer + (p_seller_id is not null)::integer <> 1 then
    return jsonb_build_object('ok', false, 'error', 'report must target a listing or a seller');
  end if;

  -- If targeting a listing, it must exist and be readable (RLS). If targeting a
  -- seller, that profile must exist.
  if p_listing_id is not null then
    if not exists (select 1 from public.listings where id = p_listing_id) then
      return jsonb_build_object('ok', false, 'error', 'listing not found');
    end if;
  else
    if not exists (select 1 from public.profiles where id = p_seller_id) then
      return jsonb_build_object('ok', false, 'error', 'seller not found');
    end if;
  end if;

  -- Rate limit: max 5 reports per reporter per target within the last hour.
  select count(*) into v_recent
  from public.reports
  where (
        (p_listing_id is not null and reported_listing_id = p_listing_id)
       or (p_seller_id is not null and reported_seller_id = p_seller_id)
    )
    and reporter_id = v_reporter
    and created_at > now() - interval '1 hour';

  if v_recent >= 5 then
    return jsonb_build_object('ok', false, 'error', 'rate limit exceeded, please wait before submitting another report');
  end if;

  -- Prevent duplicate open reports for the same target by the same reporter.
  if p_listing_id is not null and exists (
    select 1 from public.reports
    where reporter_id = v_reporter
      and reported_listing_id = p_listing_id
      and status = 'open'
  ) then
    return jsonb_build_object('ok', false, 'error', 'you already have an open report for this listing');
  end if;

  if p_seller_id is not null and exists (
    select 1 from public.reports
    where reporter_id = v_reporter
      and reported_seller_id = p_seller_id
      and status = 'open'
  ) then
    return jsonb_build_object('ok', false, 'error', 'you already have an open report for this seller');
  end if;

  insert into public.reports (reporter_id, reported_listing_id, reported_seller_id, reason, note)
  values (v_reporter, p_listing_id, p_seller_id, p_reason, p_note);

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

------------------------------------------------------------------------------
-- resolve_report RPC (SECURITY DEFINER).
-- Admin moderation action. p_action decides the verdict:
--   'remove_listing'  -> soft-delete the reported listing, close the report.
--   'block_seller'    -> set the seller's role back to 'buyer' (revokes seller
--                        tools; RLS keeps their existing listings readable),
--                        close the report.
--   'reject'          -> just close the report with status 'rejected' (no
--                        content change).
------------------------------------------------------------------------------
create or replace function public.resolve_report(
  p_report_id uuid,
  p_action text,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  select * into v_report from public.reports where id = p_report_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'report not found');
  end if;

  if v_report.status <> 'open' then
    return jsonb_build_object('ok', false, 'error', 'report already resolved');
  end if;

  if p_action = 'remove_listing' then
    if v_report.reported_listing_id is null then
      return jsonb_build_object('ok', false, 'error', 'report has no listing target');
    end if;
    -- Soft-delete the listing (mirrors softDeleteListing; RLS already gives
    -- admins full access via the "manageable by admins" policy).
    update public.listings
      set deleted_at = now(), status = 'archived'
      where id = v_report.reported_listing_id;
  elsif p_action = 'block_seller' then
    if v_report.reported_seller_id is null then
      return jsonb_build_object('ok', false, 'error', 'report has no seller target');
    end if;
    -- Revoke seller privileges: demote to buyer. This strips the seller
    -- role so the profile gate (requireSeller) blocks them.
    update public.profiles
      set role = 'buyer'
      where id = v_report.reported_seller_id;
  elsif p_action = 'reject' then
    -- No content change; just close the report.
  else
    return jsonb_build_object('ok', false, 'error', 'invalid action');
  end if;

  update public.reports
    set status = case
      when p_action = 'reject' then 'rejected'
      else 'resolved'
    end,
    note = case
      when p_admin_note is not null then
        coalesce(note, '') || ' [admin: ' || p_admin_note || ']'
      else note
    end
    where id = p_report_id;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- RPC grants: only authenticated (admin checks happen inside each function).
revoke all on function public.submit_report from public;
revoke all on function public.resolve_report from public;
grant execute on function public.submit_report to authenticated;
grant execute on function public.resolve_report to authenticated;
