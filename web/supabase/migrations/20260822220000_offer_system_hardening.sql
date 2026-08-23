-- #97 + offer system hardening: multi-round negotiation, offer audit trail,
-- and notification coverage for every status transition.
--
-- 1. offer_events: append-only audit log of every offer state change so the
--    buyer/seller can see the full negotiation history (e.g. "I offered 26k,
--    they countered at 30k, I countered at 28k, they accepted").
--
-- 2. Extend notifications to cover every transition: offer_declined,
--    offer_countered, offer_counter_accepted, offer_counter_declined.
--
-- 3. decline_counter RPC: lets a buyer walk away from a seller's counter-
--    offer (currently impossible — dead end).
--
-- 4. Multi-round counter support: counter_offer now accepts a countered
--    offer and re-counters it (buyer countering a seller's counter), so
--    negotiation loops until both agree.

create table if not exists public.offer_events (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  from_status public.offer_status,
  to_status public.offer_status not null,
  amount numeric(12, 2),
  message text,
  created_at timestamptz not null default now()
);

create index if not exists offer_events_offer_id_idx
  on public.offer_events (offer_id, created_at desc);

alter table public.offer_events enable row level security;

create policy "Offer events are readable by offer participants"
  on public.offer_events for select
  to authenticated
  using (
    actor_id = (select auth.uid())
    or exists (
      select 1 from public.offers o
      join public.listings l on l.id = o.listing_id
      where o.id = offer_events.offer_id
        and (o.buyer_id = (select auth.uid()) or l.seller_id = (select auth.uid()))
    )
  );

grant select on table public.offer_events to authenticated;

-- Extend notification types to cover every transition
alter type public.offer_status add value if not exists 'declined';
-- (already exists: pending, countered, accepted, declined, expired)

-- Add notification types for the missing transitions
-- We can't easily ALTER TYPE ADD VALUE for the notifications.type_check constraint
-- because it's a TEXT column with a CHECK constraint, not an enum.
-- Drop and recreate the constraint to add the new types.
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'offer_received',
      'offer_accepted',
      'offer_declined',
      'offer_countered',
      'offer_counter_accepted',
      'offer_counter_declined',
      'review_received',
      'report_resolved'
    )
  );

-- Notification trigger: offer_declined (seller declines buyer's offer)
create or replace function public.notify_offer_declined()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'declined' and old.status <> 'declined' then
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      new.buyer_id,
      'offer_declined',
      'Your offer was declined',
      'The seller declined your offer. You can make a new offer or browse other listings.',
      jsonb_build_object('offer_id', new.id, 'listing_id', new.listing_id, 'amount', new.amount)
    );
  end if;
  return new;
end;
$$;

create trigger notifications_offer_declined
  after update of status on public.offers
  for each row
  when (new.status = 'declined' and old.status <> 'declined')
  execute function public.notify_offer_declined();

-- Notification trigger: offer_countered (seller counters buyer's offer)
create or replace function public.notify_offer_countered()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_title text;
begin
  if new.status = 'countered' and old.status <> 'countered' then
    select title into v_listing_title from public.listings where id = new.listing_id;
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      new.buyer_id,
      'offer_countered',
      'Counter-offer received',
      'The seller countered your offer for ' || coalesce(v_listing_title, 'a listing') || '.',
      jsonb_build_object('offer_id', new.id, 'listing_id', new.listing_id, 'amount', new.amount)
    );
  end if;
  return new;
end;
$$;

create trigger notifications_offer_countered
  after update of status on public.offers
  for each row
  when (new.status = 'countered' and old.status <> 'countered')
  execute function public.notify_offer_countered();

-- Notification trigger: offer_accepted (already exists, but ensure it fires on counter-accept too)
-- The existing trigger handles status change to 'accepted', so it already covers
-- both pending→accepted and countered→accepted. No change needed.

-- decline_counter RPC: buyer walks away from a seller's counter-offer
create or replace function public.decline_counter(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
begin
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'offer not found');
  end if;

  if not (
    public.is_admin()
    or (v_offer.buyer_id = (select auth.uid()) and v_offer.status = 'countered')
  ) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  update public.offers
    set status = 'declined', expires_at = null, updated_at = now()
    where id = p_offer_id;

  -- Audit event
  insert into public.offer_events (offer_id, actor_id, from_status, to_status)
  values (p_offer_id, auth.uid(), 'countered', 'declined');

  -- Notification to seller that their counter was declined
  insert into public.notifications (user_id, type, title, body, metadata)
  select
    l.seller_id,
    'offer_counter_declined',
    'Your counter-offer was declined',
    'The buyer declined your counter-offer.',
    jsonb_build_object('offer_id', v_offer.id, 'listing_id', v_offer.listing_id)
  from public.listings l
  where l.id = v_offer.listing_id;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

grant execute on function public.decline_counter(uuid) to authenticated;

-- Update counter_offer to support multi-round negotiation.
-- Now accepts: pending (original behavior) OR countered (buyer re-counters a seller's counter).
create or replace function public.counter_offer(
  p_offer_id uuid,
  p_amount numeric,
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
  v_listing public.listings;
begin
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid amount');
  end if;
  if p_amount > 100000000 then
    return jsonb_build_object('ok', false, 'error', 'amount too large');
  end if;

  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'offer not found');
  end if;

  select * into v_listing from public.listings where id = v_offer.listing_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'listing not found');
  end if;

  -- Seller counters a pending offer, OR buyer re-counters a countered offer
  if not (
    public.is_admin()
    or (v_listing.seller_id = (select auth.uid()) and v_offer.status = 'pending')
    or (v_offer.buyer_id = (select auth.uid()) and v_offer.status = 'countered')
  ) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if v_offer.status <> 'pending' and v_offer.status <> 'countered' then
    return jsonb_build_object('ok', false, 'error', 'offer is no longer open for counter');
  end if;

  if v_listing.status <> 'published' or v_listing.deleted_at is not null then
    return jsonb_build_object('ok', false, 'error', 'listing is no longer available');
  end if;

  update public.offers
    set status = 'countered', amount = p_amount, message = nullif(trim(p_message), ''), expires_at = null, updated_at = now()
    where id = p_offer_id;

  -- Audit event
  insert into public.offer_events (offer_id, actor_id, from_status, to_status, amount, message)
  values (p_offer_id, auth.uid(), v_offer.status, 'countered', p_amount, p_message);

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

grant execute on function public.counter_offer(uuid, text) to authenticated;
-- Previous grant for (uuid, numeric) is replaced by (uuid, text) signature.
-- If the old signature exists, drop it.
drop function if exists public.counter_offer(uuid, numeric);

-- Update accept_offer to also fire a notification for counter-accepts
-- (the existing trigger already handles status='accepted', so it fires for both cases)

-- Add audit event to accept_offer
create or replace function public.accept_offer(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
  v_listing public.listings;
  v_is_seller boolean;
  v_is_buyer boolean;
begin
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'offer not found');
  end if;

  select * into v_listing from public.listings where id = v_offer.listing_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'listing not found');
  end if;

  v_is_seller := v_listing.seller_id = (select auth.uid());
  v_is_buyer := v_offer.buyer_id = (select auth.uid());

  if not (
    public.is_admin()
    or (v_is_seller and v_offer.status = 'pending')
    or (v_is_buyer and v_offer.status = 'countered')
  ) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if v_listing.status <> 'published' or v_listing.deleted_at is not null then
    return jsonb_build_object('ok', false, 'error', 'listing is no longer available');
  end if;

  update public.offers
    set status = 'accepted', expires_at = null, updated_at = now()
    where id = p_offer_id;

  update public.listings
    set status = 'sold', sold_to_buyer_id = v_offer.buyer_id
    where id = v_listing.id;

  -- Audit event
  insert into public.offer_events (offer_id, actor_id, from_status, to_status, amount)
  values (p_offer_id, auth.uid(), v_offer.status, 'accepted', v_offer.amount);

  perform public.recompute_trust_score(v_listing.seller_id);

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

grant execute on function public.accept_offer(uuid) to authenticated;

-- Add audit event to decline_offer
create or replace function public.decline_offer(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
begin
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'offer not found');
  end if;

  if not (
    public.is_admin()
    or (exists (select 1 from public.listings l where l.id = v_offer.listing_id and l.seller_id = (select auth.uid())) and v_offer.status = 'pending')
    or (v_offer.buyer_id = (select auth.uid()) and v_offer.status = 'countered')
  ) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  update public.offers
    set status = 'declined', expires_at = null, updated_at = now()
    where id = p_offer_id;

  -- Audit event
  insert into public.offer_events (offer_id, actor_id, from_status, to_status, amount)
  values (p_offer_id, auth.uid(), v_offer.status, 'declined', v_offer.amount);

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

grant execute on function public.decline_offer(uuid) to authenticated;
