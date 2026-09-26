-- Migration: 20260926170000_reports_review_target.sql
-- Review Moderation & Appeals (Slice 2, Issue #156 / #149)
-- 1. Soft-delete columns for reviews
-- 2. Review appeals table and RPCs
-- 3. Update reports table constraint to allow review targets
-- 4. Update submit_report and resolve_report for review targets

-- 1. Soft-delete columns on public.reviews
alter table public.reviews
  add column if not exists deleted_at timestamptz default null,
  add column if not exists deleted_reason text default null;

create index if not exists reviews_deleted_at_idx on public.reviews (deleted_at);

-- 2. Review appeals table
do $$
begin
  if not exists (select 1 from pg_type where typname = 'review_appeal_status') then
    create type public.review_appeal_status as enum ('pending', 'approved', 'denied');
  end if;
end;
$$;

create table if not exists public.review_appeals (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 1000),
  status public.review_appeal_status not null default 'pending',
  admin_note text check (admin_note is null or char_length(admin_note) between 1 and 1000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists review_appeals_reviewer_id_idx on public.review_appeals (reviewer_id);
create index if not exists review_appeals_status_idx on public.review_appeals (status);
create index if not exists review_appeals_created_at_idx on public.review_appeals (created_at);

alter table public.review_appeals enable row level security;

create policy "Review appeals are readable by the reviewer"
  on public.review_appeals for select
  to authenticated
  using ((select auth.uid()) = reviewer_id);

create policy "Review appeals are readable by admins"
  on public.review_appeals for select
  to authenticated
  using (public.is_admin());

create policy "Review appeals are manageable by admins"
  on public.review_appeals for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.review_appeals to authenticated;

-- 3. Update reports table target constraint
alter table public.reports drop constraint if exists reports_target_one;

alter table public.reports
  add constraint reports_target_one check (
    (reported_listing_id is not null)::integer +
    (reported_seller_id is not null)::integer +
    (review_id is not null)::integer = 1
  );

create index if not exists reports_review_id_idx on public.reports (review_id);

-- 4. Update submit_report RPC
-- Drop previous 4-arg signature to avoid ambiguous overload
drop function if exists public.submit_report(public.report_reason, uuid, uuid, text);

create or replace function public.submit_report(
  p_reason public.report_reason,
  p_listing_id uuid default null,
  p_seller_id uuid default null,
  p_note text default null,
  p_review_id uuid default null
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
  v_reporter := auth.uid();

  if v_reporter is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  -- Exactly one target: listing, seller, or review
  if (p_listing_id is not null)::integer + (p_seller_id is not null)::integer + (p_review_id is not null)::integer <> 1 then
    return jsonb_build_object('ok', false, 'error', 'report must target a listing, a seller, or a review');
  end if;

  -- Validate target exists
  if p_listing_id is not null then
    if not exists (select 1 from public.listings where id = p_listing_id) then
      return jsonb_build_object('ok', false, 'error', 'listing not found');
    end if;
  elsif p_seller_id is not null then
    if not exists (select 1 from public.profiles where id = p_seller_id) then
      return jsonb_build_object('ok', false, 'error', 'seller not found');
    end if;
  else
    if not exists (select 1 from public.reviews where id = p_review_id) then
      return jsonb_build_object('ok', false, 'error', 'review not found');
    end if;
  end if;

  -- Rate limit: max 5 reports per reporter per target within the last hour
  select count(*) into v_recent
  from public.reports
  where (
        (p_listing_id is not null and reported_listing_id = p_listing_id)
     or (p_seller_id is not null and reported_seller_id = p_seller_id)
     or (p_review_id is not null and review_id = p_review_id)
    )
    and reporter_id = v_reporter
    and created_at > now() - interval '1 hour';

  if v_recent >= 5 then
    return jsonb_build_object('ok', false, 'error', 'rate limit exceeded, please wait before submitting another report');
  end if;

  -- Prevent duplicate open reports for the same target by the same reporter
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

  if p_review_id is not null and exists (
    select 1 from public.reports
    where reporter_id = v_reporter
      and review_id = p_review_id
      and status = 'open'
  ) then
    return jsonb_build_object('ok', false, 'error', 'you already have an open report for this review');
  end if;

  insert into public.reports (reporter_id, reported_listing_id, reported_seller_id, review_id, reason, note)
  values (v_reporter, p_listing_id, p_seller_id, p_review_id, p_reason, p_note);

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- 5. Update remove_review to soft-delete and recompute trust score
create or replace function public.remove_review(p_review_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review public.reviews;
  v_seller_id uuid;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  select * into v_review from public.reviews where id = p_review_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'review not found');
  end if;

  v_seller_id := v_review.seller_id;

  update public.reviews
    set deleted_at = now(),
        deleted_reason = p_reason
    where id = p_review_id;

  -- Recompute trust score after removal (organic and non-deleted reviews only)
  update public.profiles
    set trust_score = (
      select coalesce(round(avg(rating) * 20)::smallint, 50)
      from public.reviews
      where seller_id = v_seller_id
        and source = 'organic'
        and deleted_at is null
    )
    where id = v_seller_id;

  return jsonb_build_object('ok', true, 'error', null, 'seller_id', v_seller_id);
end;
$$;

-- 6. Update resolve_report to handle remove_review
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
    update public.listings
      set deleted_at = now(), status = 'archived'
      where id = v_report.reported_listing_id;
  elsif p_action = 'block_seller' then
    if v_report.reported_seller_id is null then
      return jsonb_build_object('ok', false, 'error', 'report has no seller target');
    end if;
    update public.profiles
      set role = 'buyer'
      where id = v_report.reported_seller_id;
    update public.listings
      set deleted_at = now(), status = 'archived'
      where seller_id = v_report.reported_seller_id
        and deleted_at is null
        and status in ('published', 'draft');
  elsif p_action = 'remove_review' then
    if v_report.review_id is null then
      return jsonb_build_object('ok', false, 'error', 'report has no review target');
    end if;
    perform public.remove_review(v_report.review_id, coalesce(p_admin_note, 'Removed via report resolution'));
  elsif p_action = 'reject' then
    -- No content change; close report
  else
    return jsonb_build_object('ok', false, 'error', 'invalid action');
  end if;

  update public.reports
    set status = case
      when p_action = 'reject' then 'rejected'::public.report_status
      else 'resolved'::public.report_status
    end,
    note = case
      when p_admin_note is not null then
        left(coalesce(note, '') || ' [admin: ' || p_admin_note || ']', 1000)
      else note
    end
    where id = p_report_id;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- 7. appeal_review_removal RPC
create or replace function public.appeal_review_removal(p_review_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid;
  v_review public.reviews;
  v_rows integer;
begin
  v_caller := auth.uid();
  if v_caller is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  if p_reason is null or char_length(trim(p_reason)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'reason is required');
  end if;

  if char_length(p_reason) > 1000 then
    return jsonb_build_object('ok', false, 'error', 'reason is too long');
  end if;

  select * into v_review from public.reviews where id = p_review_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'review not found');
  end if;

  if v_review.buyer_id <> v_caller then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if v_review.deleted_at is null then
    return jsonb_build_object('ok', false, 'error', 'review is not removed');
  end if;

  insert into public.review_appeals (review_id, reviewer_id, reason)
  values (p_review_id, v_caller, trim(p_reason))
  on conflict (review_id) do nothing;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'error', 'already appealed');
  end if;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- 8. resolve_review_appeal RPC
create or replace function public.resolve_review_appeal(
  p_appeal_id uuid,
  p_action text,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appeal public.review_appeals;
  v_review public.reviews;
  v_seller_id uuid;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  select * into v_appeal from public.review_appeals where id = p_appeal_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'appeal not found');
  end if;

  if v_appeal.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'appeal already resolved');
  end if;

  select * into v_review from public.reviews where id = v_appeal.review_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'review not found');
  end if;

  v_seller_id := v_review.seller_id;

  if p_action = 'approve' then
    -- Restore the review
    update public.reviews
      set deleted_at = null,
          deleted_reason = null
      where id = v_appeal.review_id;

    -- Recompute seller trust score
    update public.profiles
      set trust_score = (
        select coalesce(round(avg(rating) * 20)::smallint, 50)
        from public.reviews
        where seller_id = v_seller_id
          and source = 'organic'
          and deleted_at is null
      )
      where id = v_seller_id;

    update public.review_appeals
      set status = 'approved',
          admin_note = p_admin_note,
          resolved_at = now()
      where id = p_appeal_id;

  elsif p_action = 'deny' then
    update public.review_appeals
      set status = 'denied',
          admin_note = p_admin_note,
          resolved_at = now()
      where id = p_appeal_id;
  else
    return jsonb_build_object('ok', false, 'error', 'invalid action');
  end if;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- Permissions and grants
revoke all on function public.submit_report(public.report_reason, uuid, uuid, text, uuid) from public;
revoke all on function public.resolve_report(uuid, text, text) from public;
revoke all on function public.remove_review(uuid, text) from public;
revoke all on function public.appeal_review_removal(uuid, text) from public;
revoke all on function public.resolve_review_appeal(uuid, text, text) from public;

grant execute on function public.submit_report(public.report_reason, uuid, uuid, text, uuid) to authenticated;
grant execute on function public.resolve_report(uuid, text, text) to authenticated;
grant execute on function public.remove_review(uuid, text) to authenticated;
grant execute on function public.appeal_review_removal(uuid, text) to authenticated;
grant execute on function public.resolve_review_appeal(uuid, text, text) to authenticated;
