-- #97 - Payment recovery: one "deal closed" state machine.
--
-- The offers flow marks a listing sold the instant the seller accepts an offer
-- (accept_offer), before any money has moved. If the buyer then abandons the
-- Chapa checkout, the listing would be stranded: sold forever, with a pending
-- payment row that begin_payment refuses to replace (blocking a retry) and no
-- path back to the market. The demo exception itself is recorded on main as
-- ADR-021 (Transaction Handling): no in-app payments ship; Chapa is a demo-only
-- beat for judges to see money move in test mode.
--
-- This migration makes the state machine recoverable without moving the
-- terminal signal off accept_offer (the seller accepting an offer still takes
-- the listing off the market; money then confirms the deal):
--
--   1. begin_payment auto-expires stale pending attempts (older than 30 min) so
--      an abandoned checkout can never lock the buyer out of a retry.
--   2. abandon_sale is the seller's recovery path: it fails any pending
--      attempts, declines the accepted offer, and reopens the listing — but only
--      while no payment has actually landed (a paid row makes the sale real).
--
-- The deal-closed decision therefore lives in one place: the payment row
-- reaching 'paid' (money moved) or the buyer confirming receipt. 'sold' is the
-- market-side intent; it can be walked back when no money moved.

-- begin_payment: auto-expire stale pending attempts before the existing-row
-- check. Only the offer's buyer can call this RPC, so the rows being expired
-- are their own abandoned attempts on the same offer.
create or replace function public.begin_payment(
  p_offer_id uuid,
  p_tx_ref text,
  p_amount numeric,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
  v_existing uuid;
  v_seller_id uuid;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  if p_tx_ref is null or p_tx_ref !~ '^[A-Za-z0-9_-]{8,64}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid tx ref');
  end if;

  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'offer not found');
  end if;

  if not (public.is_admin() or v_offer.buyer_id = (select auth.uid())) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if v_offer.status <> 'accepted' then
    return jsonb_build_object('ok', false, 'error', 'offer is not accepted');
  end if;

  -- The buyer pays exactly what the seller accepted; nothing else.
  if p_amount is null or p_amount <> v_offer.amount then
    return jsonb_build_object('ok', false, 'error', 'amount mismatch');
  end if;
  if p_currency is null or upper(p_currency) <> 'ETB' then
    return jsonb_build_object('ok', false, 'error', 'currency not supported');
  end if;

  -- An abandoned checkout leaves a pending row that would otherwise block a
  -- retry forever (the verify trigger lives on the return callback, so a tab
  -- closed mid-checkout may never fail the row). Expire stale pending attempts
  -- so the buyer can try again.
  update public.payments
    set status = 'failed'
    where offer_id = p_offer_id
      and status = 'pending'
      and created_at < now() - interval '30 minutes';

  select id into v_existing from public.payments
  where offer_id = p_offer_id and status in ('pending', 'paid')
  order by created_at desc
  limit 1;
  if found then
    return jsonb_build_object('ok', false, 'error', 'payment already exists');
  end if;

  select seller_id into v_seller_id
  from public.listings where id = v_offer.listing_id;

  insert into public.payments (
    offer_id, listing_id, buyer_id, seller_id, amount, currency, tx_ref,
    status, mode
  ) values (
    p_offer_id, v_offer.listing_id, v_offer.buyer_id, v_seller_id,
    p_amount, 'ETB', p_tx_ref, 'pending', 'test'
  );

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- abandon_sale: the seller's recovery path when the buyer never pays. Fails any
-- pending attempts, declines the accepted offer, and reopens the listing to the
-- market. Guarded on no paid payment having landed: once money moved, the sale
-- is real and cannot be walked back by a seller who changed their mind.
create or replace function public.abandon_sale(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
  v_listing public.listings;
  v_paid uuid;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'offer not found');
  end if;

  select * into v_listing from public.listings where id = v_offer.listing_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'listing not found');
  end if;

  -- Only the seller (or an admin) can abandon a sale they agreed to.
  if not (public.is_admin() or v_listing.seller_id = (select auth.uid())) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if v_offer.status <> 'accepted' then
    return jsonb_build_object('ok', false, 'error', 'offer is not accepted');
  end if;

  -- Money moved? Then the deal is closed; no recovery.
  select id into v_paid from public.payments
  where offer_id = p_offer_id and status = 'paid'
  limit 1;
  if found then
    return jsonb_build_object('ok', false, 'error', 'payment already received');
  end if;

  -- Fail any pending attempts so they never block a future payment, decline the
  -- offer, and put the listing back on the market.
  update public.payments
    set status = 'failed'
    where offer_id = p_offer_id and status = 'pending';

  update public.offers
    set status = 'declined'
    where id = p_offer_id;

  update public.listings
    set status = 'published', sold_to_buyer_id = null
    where id = v_listing.id;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

revoke all on function public.begin_payment(uuid, text, numeric, text) from public;
revoke all on function public.abandon_sale(uuid) from public;
grant execute on function public.begin_payment(uuid, text, numeric, text) to authenticated;
grant execute on function public.abandon_sale(uuid) to authenticated;