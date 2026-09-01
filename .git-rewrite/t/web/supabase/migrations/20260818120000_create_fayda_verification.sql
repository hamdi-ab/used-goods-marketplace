-- #25 (T21) - Fayda verification: self-issued OIDC write path
-- Records a Fayda verification that a user proved for themselves via a server-side
-- OIDC exchange (#25, ADR-020). This is the self-issued counterpart to the
-- admin-gated `record_verification` RPC: it lets a signed-in user flip their own
-- `fayda_verified` flag after their identity was authenticated against the
-- national-ID (real eSignet or the dev-only mock), and stores the unique Fayda
-- `sub` as verification evidence.
--
-- Why a sibling RPC rather than reusing record_verification: record_verification
-- is admin-only (`is_admin()`), so the user's own successful exchange could not
-- reach it. record_fayda_verification is SECURITY DEFINER, callable by
-- auth.uid() for their own profile only (p_user_id = auth.uid()), and trusts
-- the `sub` only because the caller (the /verify-fayda/callback route) already
-- validated the signed userinfo JWT server-side. No admin step is forced into
-- the flow.
--
-- Mirrors record_verification's audited write for type='fayda': soft-delete the
-- prior live fayda row (so the verifications_one_active_per_type index is never
-- violated), insert an audit row with the verified sub, flip the cached flag,
-- and bump trust_score +20 (clamped 0-100) per the Trust Score model. Phone
-- and admin-issued verifications are untouched here.
--
-- Scope: adds the `sub` column to verifications (non-PII, ≤256 chars). The
-- column lives on the audit row, not on profiles; profiles keeps only the
-- boolean `fayda_verified` cached flag (DB spec §15: the table is the source of
-- truth, profile flags are a cached projection).

-- A unique Fayda `sub` is non-PII-bearing proof but should be bounded and
-- distinct per row's verification evidence. Smallint/ETB aside, sub max ~256
-- (eSignet `sub` is a numeric PSUT string).
alter table if exists public.verifications
  add column if not exists sub text check (sub is null or char_length(sub) <= 256);

-- Self-issued path: auth.uid() must own the profile the flag is flipping. The
-- verified sub is the proof (the callback already checked the signed JWT).
create or replace function public.record_fayda_verification(
  p_user_id uuid,
  p_sub text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := (select auth.uid());
begin
  -- Only the user themselves may record their own Fayda verification.
  if v_caller is null or v_caller <> p_user_id then
    return jsonb_build_object('ok', false, 'error', 'not your profile');
  end if;
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'user id is required');
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    return jsonb_build_object('ok', false, 'error', 'profile not found');
  end if;
  if p_sub is null or btrim(p_sub) = '' then
    return jsonb_build_object('ok', false, 'error', 'fayda sub is required');
  end if;

  -- One live verification per (user, type): a successful re-verify supersedes
  -- the prior live row (INV-009 — the prior row's status is never mutated, just
  -- soft-deleted), keeping the verifications_one_active_per_type index valid.
  update public.verifications
    set deleted_at = now()
    where user_id = p_user_id
      and type = 'fayda'
      and deleted_at is null;

  insert into public.verifications (user_id, type, status, sub, verified_at)
  values (p_user_id, 'fayda', 'verified', p_sub, now());

  -- Cached projection on profiles (read model) + trust score bump.
  update public.profiles
    set fayda_verified = true
  where id = p_user_id;

  update public.profiles
    set trust_score = least(trust_score + 20, 100)
  where id = p_user_id;

  return jsonb_build_object('ok', true, 'error', null, 'user_id', p_user_id, 'type', 'fayda');
end;
$$;

-- Self-issued: callable by the authenticated user for their own profile only.
-- Revoke default public EXECUTE; grant to authenticated (anonymous refused),
-- matching record_verification's grant posture (verifications have no client
-- INSERT/UPDATE/DELETE policy — the SECURITY DEFINER RPC is the sole writer).
revoke all on function public.record_fayda_verification(uuid, text) from public;
grant execute on function public.record_fayda_verification(uuid, text) to authenticated;
