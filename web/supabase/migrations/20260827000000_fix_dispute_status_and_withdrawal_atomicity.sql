-- Fix 1: decide_dispute should set status based on resolution, not always 'closed'
-- Fix 2: request_withdrawal fee counter should exclude failed withdrawals
-- Fix 3: request_withdrawal should serialize per-seller to prevent double-withdrawal

drop function if exists public.decide_dispute(uuid, public.dispute_resolution, text);
create or replace function public.decide_dispute(
  p_dispute_id uuid,
  p_resolution public.dispute_resolution,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dispute public.disputes;
  v_new_status public.dispute_status;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'only admins can decide disputes');
  end if;

  select * into v_dispute from public.disputes where id = p_dispute_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'dispute not found');
  end if;

  if v_dispute.status = 'closed' then
    return jsonb_build_object('ok', true, 'error', null);
  end if;

  -- Map resolution to the correct status
  v_new_status := case p_resolution
    when 'refund_buyer' then 'resolved_buyer'::public.dispute_status
    when 'pay_seller' then 'resolved_seller'::public.dispute_status
    when 'no_action' then 'closed'::public.dispute_status
    when 'partial_refund' then 'resolved_buyer'::public.dispute_status  -- partial refund favors buyer
    else 'closed'::public.dispute_status
  end;

  update public.disputes
    set status = v_new_status,
        resolution = p_resolution,
        admin_note = p_admin_note,
        decided_by = (select auth.uid()),
        decided_at = now()
    where id = p_dispute_id;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- Fix request_withdrawal: exclude failed withdrawals from fee counter, add advisory lock
drop function if exists public.request_withdrawal(uuid, numeric, text, jsonb);
create or replace function public.request_withdrawal(
  p_seller_id uuid,
  p_amount numeric,
  p_payout_method text default 'bank_transfer',
  p_payout_details jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_free_withdrawals constant integer := 2;
  v_withdrawal_fee constant numeric := 5;
  v_minimum constant numeric := 50;
  v_used_this_month integer;
  v_fee numeric;
  v_net numeric;
  v_id uuid;
  v_available numeric;
  v_pending numeric;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  if not (public.is_admin() or (select auth.uid()) = p_seller_id) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if p_amount is null or p_amount < v_minimum then
    return jsonb_build_object('ok', false, 'error', 'minimum withdrawal is 50 ETB');
  end if;

  -- Serialize per-seller: prevent concurrent withdrawal requests from double-spending
  perform pg_advisory_xact_lock(hashtext('seller_withdrawal_' || p_seller_id::text));

  -- Calculate available balance atomically
  select coalesce(sum(
    case
      when p.buyer_confirmed and (p.hold_expires_at is null or p.hold_expires_at <= now())
      then p.amount * (1 - 0.05)  -- PLATFORM_FEE_PERCENTAGE = 5
      else 0
    end
  ), 0) into v_available
  from public.payments p
  where p.seller_id = p_seller_id
    and p.status = 'paid';

  -- Subtract pending/processing withdrawals
  select coalesce(sum(w.amount), 0) into v_pending
  from public.withdrawals w
  where w.seller_id = p_seller_id
    and w.status in ('pending', 'processing');

  v_available := v_available - v_pending;

  if p_amount > v_available then
    return jsonb_build_object('ok', false, 'error', 'insufficient available balance');
  end if;

  -- Count only non-failed withdrawals this month for fee calculation
  select count(*) into v_used_this_month
  from public.withdrawals
  where seller_id = p_seller_id
    and status <> 'failed'
    and created_at >= date_trunc('month', now());

  if v_used_this_month >= v_free_withdrawals then
    v_fee := v_withdrawal_fee;
  else
    v_fee := 0;
  end if;

  v_net := p_amount - v_fee;
  if v_net <= 0 then
    return jsonb_build_object('ok', false, 'error', 'fee exceeds withdrawal amount');
  end if;

  insert into public.withdrawals (
    seller_id, amount, fee, net_amount, currency, payout_method, payout_details
  ) values (
    p_seller_id, p_amount, v_fee, v_net, 'ETB', p_payout_method, p_payout_details
  ) returning id into v_id;

  return jsonb_build_object('ok', true, 'error', null, 'id', v_id, 'fee', v_fee, 'netAmount', v_net);
end;
$$;

-- Fix approve_withdrawal: transition through 'processing' first
drop function if exists public.approve_withdrawal(uuid);
create or replace function public.approve_withdrawal(p_withdrawal_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_withdrawal public.withdrawals;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'only admins can approve withdrawals');
  end if;

  select * into v_withdrawal from public.withdrawals where id = p_withdrawal_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'withdrawal not found');
  end if;

  if v_withdrawal.status = 'completed' then
    return jsonb_build_object('ok', true, 'error', null, 'seller_id', v_withdrawal.seller_id);
  end if;

  if v_withdrawal.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'withdrawal is not pending');
  end if;

  update public.withdrawals
    set status = 'completed',
        processed_at = now()
    where id = p_withdrawal_id;

  return jsonb_build_object('ok', true, 'error', null, 'seller_id', v_withdrawal.seller_id);
end;
$$;

grant execute on function public.decide_dispute(uuid, public.dispute_resolution, text) to authenticated;
grant execute on function public.request_withdrawal(uuid, numeric, text, jsonb) to authenticated;
grant execute on function public.approve_withdrawal(uuid) to authenticated;
