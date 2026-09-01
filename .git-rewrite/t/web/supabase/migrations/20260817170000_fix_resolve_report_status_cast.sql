-- Discovered while testing #72: resolve_report's closing UPDATE assigned a
-- CASE that resolved to text (`'rejected'`/`'resolved'` untyped literals), so
-- `set status = case ... end` failed with 42804 on PostgreSQL 18 (untyped
-- literals are now text, losing the old implicit enum coercion). No report
-- could ever be resolved. Recreate the function with explicit enum casts.
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
    -- role so the profile gate (requireSeller) blocks them. Any active
    -- listings they have are soft-deleted so they disappear from all reads.
    update public.profiles
      set role = 'buyer'
      where id = v_report.reported_seller_id;
    update public.listings
      set deleted_at = now(), status = 'archived'
      where seller_id = v_report.reported_seller_id
        and deleted_at is null
        and status in ('published', 'draft');
  elsif p_action = 'reject' then
    -- No content change; just close the report.
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
        -- Truncate to honour the reports_note_length check (1000 chars).
        left(coalesce(note, '') || ' [admin: ' || p_admin_note || ']', 1000)
      else note
    end
    where id = p_report_id;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- RPC grants: only authenticated (admin checks happen inside each function).
revoke all on function public.resolve_report from public;
grant execute on function public.resolve_report to authenticated;