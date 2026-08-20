-- #73 (parent #68) - make the verification workflow reachable from the UI.
-- Audit P0.3: the record_verification RPC (T12) was defined but no server
-- action or page called it, so phone_verified/fayda_verified could never be set
-- through the app and the trust badges were display-only. PRD FS-014 requires a
-- Verification Review module (admin action "Approve Verification") and the issue
-- asks for a self-serve verification request UI.
--
-- This migration adds the missing self-serve half: request_verification inserts
-- a 'pending' row for the caller's own (user, type). Admins act on it through
-- the existing record_verification RPC (unchanged), which flips the profile flag
-- and bumps Trust Score. The verifications table keeps its RLS posture: no
-- client INSERT/UPDATE/DELETE policies — request_verification (SECURITY
-- DEFINER, auth.uid()-resolved) is the only request path and record_verification
-- stays the only admin write path (INV-009).
--
-- Self-serve types are limited to the badge set ('phone', 'fayda'); email and
-- telegram have no public badge yet and remain admin-only (future AC). The
-- request path is rate-limited in the app layer (security spec §16), matching
-- every other write action's consume_rate_budget guard.

create or replace function public.request_verification(
  p_type public.verification_type
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'sign in to request verification');
  end if;
  if p_type is null or p_type not in ('phone', 'fayda') then
    return jsonb_build_object('ok', false, 'error', 'only phone and fayda verification can be requested');
  end if;
  if not exists (select 1 from public.profiles where id = v_user_id) then
    return jsonb_build_object('ok', false, 'error', 'profile not found');
  end if;
  -- One live row per (user, type): refuse when a pending or verified row is
  -- already live so the one-live-per-type index cannot be violated.
  if exists (
    select 1 from public.verifications
    where user_id = v_user_id
      and type = p_type
      and status in ('pending', 'verified')
      and deleted_at is null
  ) then
    return jsonb_build_object('ok', false, 'error', 'already requested');
  end if;

  insert into public.verifications (user_id, type, status)
  values (v_user_id, p_type, 'pending');

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- RPC grants: authenticated-only (the caller is auth.uid()-scoped); the
-- implicit EXECUTE from public stays revoked so anon callers are refused.
revoke all on function public.request_verification(public.verification_type) from public;
grant execute on function public.request_verification(public.verification_type) to authenticated;
