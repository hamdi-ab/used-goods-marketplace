-- #97 - Chapa sandbox payment demo (offer transaction)
-- payments: one ledger row per payment attempt on an accepted offer. The
-- marketplace MVP deliberately ships without billing (monetization §17/§18);
-- this is the demo-only exception so judges can see real money (in Chapa test
-- mode) move at the moment of the deal.
--
-- Flow: seller accepts an offer (accept_offer already marks the listing sold),
-- the buyer clicks "Pay with Chapa", a server action begins a payment row here,
-- redirects to Chapa's hosted checkout, then verifies the transaction on
-- return. Direct payment semantics: buyer pays seller; the listing is already
-- sold; a "Confirm receipt" flag closes the deal (buyer-protection signal,
-- no escrow state machine).
--
-- Writes go through SECURITY DEFINER RPCs (begin/complete/fail/confirm) that
-- re-check the caller against the offer/payment row, mirroring the offers
-- pattern. RLS grants only SELECT to participants + admins; there is no
-- INSERT/UPDATE grant at all, so a compromised anon key cannot write payments.

create type public.payment_status as enum ('pending', 'paid', 'failed');

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'ETB',
  tx_ref text not null unique,
  status public.payment_status not null default 'pending',
  mode text not null default 'test',
  buyer_confirmed boolean not null default false,
  paid_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The demo only ever moves ETB in Chapa test mode; a live integration would
-- add a new migration, not loosen this check.
alter table public.payments
  add constraint payments_currency_etb
  check (currency = 'ETB');

alter table public.payments
  add constraint payments_mode_test
  check (mode = 'test');

create index if not exists payments_offer_id_idx on public.payments (offer_id);
create index if not exists payments_buyer_id_idx on public.payments (buyer_id);
create index if not exists payments_seller_id_idx on public.payments (seller_id);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.handle_updated_at();

-----------------------------------------------------------------------------
-- RLS: the buyer and the seller can read the payment, admins have full
-- access. No participant writes directly — every transition is an RPC below.
-----------------------------------------------------------------------------
alter table public.payments enable row level security;

create policy "Payments are readable by the buyer or the seller"
  on public.payments for select
  to authenticated
  using (
    (select auth.uid()) = buyer_id
    or (select auth.uid()) = seller_id
    or public.is_admin()
  );

create policy "Payments are manageable by admins"
  on public.payments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-----------------------------------------------------------------------------
-- Transition RPCs (SECURITY DEFINER; each one re-checks the caller). Rows are
-- locked so a buyer cannot begin two payments on one offer at once and the
-- verify path cannot race the retry path.
-----------------------------------------------------------------------------

-- Creates the pending payment for an accepted offer. Only the offer's buyer
-- may begin, only on an accepted offer, only for the exact agreed amount, and
-- only when no pending/paid payment already exists (a failed attempt may be
-- retried). The server action supplies the Chapa tx_ref; the RPC pins the
-- amount and currency so a tampered tx_ref still settles the agreed price.
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

-- Marks a pending payment paid after a successful Chapa verify. The server
-- passes back exactly what Chapa reported (mode, amount, currency) and the RPC
-- re-checks it against the row pinned at begin time, so a client can never
-- mark its own payment paid. Idempotent: re-verifying an already-paid payment
-- is a no-op success, so page refreshes on the return URL stay clean.
create or replace function public.complete_payment(
  p_tx_ref text,
  p_mode text,
  p_amount numeric,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
begin
  select * into v_payment from public.payments where tx_ref = p_tx_ref for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'payment not found');
  end if;

  -- Caller gate first: this is a SECURITY DEFINER RPC that bypasses RLS, so no
  -- branch (including the idempotent already-paid path) may run for a
  -- non-participant. Mirrors the offers transition RPCs.
  if not (public.is_admin() or v_payment.buyer_id = (select auth.uid())) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if v_payment.status = 'paid' then
    return jsonb_build_object('ok', true, 'error', null);
  end if;
  if v_payment.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'payment is not pending');
  end if;

  if p_mode <> v_payment.mode then
    return jsonb_build_object('ok', false, 'error', 'mode mismatch');
  end if;
  if p_amount is null or p_amount <> v_payment.amount then
    return jsonb_build_object('ok', false, 'error', 'amount mismatch');
  end if;
  if p_currency is null or upper(p_currency) <> v_payment.currency then
    return jsonb_build_object('ok', false, 'error', 'currency mismatch');
  end if;

  update public.payments
    set status = 'paid', paid_at = now()
    where id = v_payment.id;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- Marks a pending payment failed (e.g. the Chapa initialize call errored) so
-- the buyer can retry. The buyer is the only participant who can fail a
-- payment they began.
create or replace function public.fail_payment(p_tx_ref text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
begin
  select * into v_payment from public.payments where tx_ref = p_tx_ref for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'payment not found');
  end if;

  if v_payment.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'payment is not pending');
  end if;

  if not (public.is_admin() or v_payment.buyer_id = (select auth.uid())) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  update public.payments set status = 'failed' where id = v_payment.id;
  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- The buyer-protection signal: the buyer confirms they received the item,
-- closing the deal. Requires a paid payment on the offer; idempotent.
create or replace function public.confirm_payment_receipt(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
begin
  select * into v_payment from public.payments
  where offer_id = p_offer_id and status = 'paid'
  order by paid_at desc
  limit 1
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no paid payment');
  end if;

  if not (public.is_admin() or v_payment.buyer_id = (select auth.uid())) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if v_payment.buyer_confirmed then
    return jsonb_build_object('ok', true, 'error', null);
  end if;

  update public.payments
    set buyer_confirmed = true, confirmed_at = now()
    where id = v_payment.id;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

grant select on public.payments to authenticated;

-- RPC grants: the payment RPCs are buyer/seller-scoped (not public), mirroring
-- the offers grants; revoking from public keeps the implicit EXECUTE grant from
-- exposing them.
revoke all on function public.begin_payment(uuid, text, numeric, text) from public;
revoke all on function public.complete_payment(text, text, numeric, text) from public;
revoke all on function public.fail_payment(text) from public;
revoke all on function public.confirm_payment_receipt(uuid) from public;
grant execute on function public.begin_payment(uuid, text, numeric, text) to authenticated;
grant execute on function public.complete_payment(text, text, numeric, text) to authenticated;
grant execute on function public.fail_payment(text) to authenticated;
grant execute on function public.confirm_payment_receipt(uuid) to authenticated;
