-- #97 — Apply a paid Pro upgrade to the seller's tier. SECURITY DEFINER so it
-- bypasses the admin-only profiles_guard_tier_change trigger: the RPC itself is
-- the gate (valid paid upgrade_intents row owned by the caller). After upgrade
-- the row is marked consumed so a tx_ref cannot be replayed.
--
-- Called from the Chapa return callback (lib/payments) once the tx_ref is
-- verified. Idempotent: re-running on an already-consumed row is a no-op.

create or replace function public.apply_upgrade(p_tx_ref text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_tier public.account_tier;
begin
  select user_id, tier
    into v_user_id, v_tier
    from public.upgrade_intents
   where tx_ref = p_tx_ref
     and consumed_at is null
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'upgrade_not_found');
  end if;

  if v_user_id is distinct from auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'not_owner');
  end if;

  -- Mark as consumed FIRST so the guard trigger allows the tier change
  update public.upgrade_intents
     set consumed_at = now()
   where tx_ref = p_tx_ref;

  -- Now update tier (trigger checks for consumed upgrade)
  update public.profiles
     set tier = 'pro'
   where id = v_user_id
     and tier = 'free';

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

grant execute on function public.apply_upgrade(text) to authenticated;
