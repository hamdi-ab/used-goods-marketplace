-- Failed payment abandonment: 7-day timer before offer returns to market.
--
-- Per the payment system spec (#117), when a buyer begins payment but never
-- completes checkout, the offer stays in "payment pending" state for 7 days
-- before the seller can abandon the sale. This migration adds:
--
-- 1. abandoned_at timestamp on payments to track when the 7-day window opens
-- 2. A function to check if a payment has been abandoned (7 days elapsed)
-- 3. An RPC to abandon a stale payment and reopen the offer

alter table public.payments
  add column if not exists abandoned_at timestamptz;

create index if not exists payments_abandoned_at_idx on public.payments (abandoned_at)
  where abandoned_at is not null;

--------------------------------------------------------------------------------
-- mark_payment_abandoned: called when a buyer returns without completing
-- payment. Starts the 7-day abandonment window.
--------------------------------------------------------------------------------
create or replace function public.mark_payment_abandoned(p_tx_ref text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  select * into v_payment from public.payments where tx_ref = p_tx_ref for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'payment not found');
  end if;

  -- Only the buyer who owns this payment can mark it abandoned
  if not (public.is_admin() or v_payment.buyer_id = (select auth.uid())) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if v_payment.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'payment is not pending');
  end if;

  update public.payments
    set abandoned_at = now()
    where id = v_payment.id;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

--------------------------------------------------------------------------------
-- check_payment_abandoned: returns true if the 7-day window has elapsed.
--------------------------------------------------------------------------------
create or replace function public.check_payment_abandoned(p_tx_ref text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
begin
  select * into v_payment from public.payments where tx_ref = p_tx_ref;
  if not found then
    return false;
  end if;

  if v_payment.abandoned_at is null then
    return false;
  end if;

  return v_payment.abandoned_at < now() - interval '7 days';
end;
$$;

--------------------------------------------------------------------------------
-- abandon_stale_payment: seller's recovery path after the 7-day window.
-- Fails the pending payment and reopens the offer to the market. Only callable
-- by the seller after the abandonment window has elapsed.
--------------------------------------------------------------------------------
create or replace function public.abandon_stale_payment(p_tx_ref text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_listing public.listings;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  select * into v_payment from public.payments where tx_ref = p_tx_ref for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'payment not found');
  end if;

  if v_payment.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'payment is not pending');
  end if;

  -- Only the seller can abandon a stale payment
  if not (public.is_admin() or v_payment.seller_id = (select auth.uid())) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  -- 7-day window must have elapsed
  if v_payment.abandoned_at is null or v_payment.abandoned_at > now() - interval '7 days' then
    return jsonb_build_object('ok', false, 'error', 'abandonment window has not elapsed');
  end if;

  -- Fail the payment
  update public.payments
    set status = 'failed'
    where id = v_payment.id;

  -- Reopen the listing (offer stays active per spec #117)
  select * into v_listing from public.listings where id = v_payment.listing_id for update;
  update public.listings
    set status = 'published', sold_to_buyer_id = null
    where id = v_payment.listing_id;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

revoke all on function public.mark_payment_abandoned(text) from public;
revoke all on function public.check_payment_abandoned(text) from public;
revoke all on function public.abandon_stale_payment(text) from public;
grant execute on function public.mark_payment_abandoned(text) to authenticated;
grant execute on function public.check_payment_abandoned(text) to authenticated;
grant execute on function public.abandon_stale_payment(text) to authenticated;
