-- #71 (parent #68) - become-a-seller path.
-- Audit P0.1: requireSeller() redirected non-sellers to /profile behind a
-- "future become a seller prompt" comment; sellers existed only via DB seed.
-- Selling is the core marketplace loop, so a buyer can now self-promote.
-- Driven by the dashboard "Start selling" CTA + the profile-page nudge.
--
-- promote_to_seller is SECURITY DEFINER: identity comes from auth.uid(), never
-- the client, and the guard is idempotent (re-promotion is a successful no-op),
-- which also makes it the restore path for an admin-suspended seller (#19).

create or replace function public.promote_to_seller()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_role text;
begin
  v_user := auth.uid();
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  select role into v_role
  from public.profiles
  where id = v_user;

  if v_role is null then
    return jsonb_build_object('ok', false, 'error', 'profile not found');
  end if;

  -- Idempotency guard: already a seller is a successful no-op.
  if v_role = 'seller' then
    return jsonb_build_object('ok', true, 'error', null);
  end if;

  -- Admins are moderation-only (ADR-020): they cannot trade, so refuse.
  if v_role = 'admin' then
    return jsonb_build_object('ok', false, 'error', 'admins cannot sell');
  end if;

  update public.profiles
  set role = 'seller'
  where id = v_user;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

revoke all on function public.promote_to_seller() from public;
grant execute on function public.promote_to_seller() to authenticated;
