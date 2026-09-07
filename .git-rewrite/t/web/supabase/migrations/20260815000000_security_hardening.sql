-- T15 - Polish, accessibility & Lighthouse: security pass
-- Two gaps closed (per the T15 audit):
--   1. offers/contact_attempts had no rate limit and accepted direct inserts.
--      Mirrors the reports pattern (submit_report): move the write behind a
--      SECURITY DEFINER RPC that enforces a per-target window, and revoke the
--      raw INSERT so the limit cannot be bypassed.
--   2. listing_images UPDATE policy had `using` but no `with check`, letting a
--      seller rewrite image_url/alt_text/display_order to arbitrary values.

-- The per-buyer-per-seller rate limit below needs the attempt's initiator
-- recorded. The T13 table only captured the target (seller_id), so add the
-- buyer side (populated by the RPC from auth.uid(), never client-supplied).
alter table public.contact_attempts
  add column if not exists buyer_id uuid references public.profiles (id) on delete cascade;

create index if not exists contact_attempts_buyer_id_idx
  on public.contact_attempts (buyer_id);

-----------------------------------------------------------------------------
-- 1. submit_offer RPC (rate-limited offer submission)
-----------------------------------------------------------------------------
create or replace function public.submit_offer(
  p_listing_id uuid,
  p_amount numeric,
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
  v_recent integer;
begin
  v_buyer := auth.uid();
  if v_buyer is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid amount');
  end if;
  if p_amount > 100000000 then
    return jsonb_build_object('ok', false, 'error', 'amount too large');
  end if;
  if p_message is not null and char_length(p_message) > 500 then
    return jsonb_build_object('ok', false, 'error', 'message too long');
  end if;

  -- The listing must be live, published, and not the buyer's own (INV-005).
  if not exists (
    select 1 from public.listings
    where id = p_listing_id
      and status = 'published'
      and deleted_at is null
      and seller_id <> v_buyer
  ) then
    return jsonb_build_object('ok', false, 'error', 'listing is not available for offers');
  end if;

  -- Rate limit: max 10 offers per buyer per listing within the last hour.
  select count(*) into v_recent
  from public.offers
  where buyer_id = v_buyer
    and listing_id = p_listing_id
    and created_at > now() - interval '1 hour';

  if v_recent >= 10 then
    return jsonb_build_object('ok', false, 'error', 'rate limit exceeded, please wait before submitting another offer');
  end if;

  insert into public.offers (listing_id, buyer_id, amount, message)
  values (p_listing_id, v_buyer, p_amount, nullif(trim(p_message), ''));

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

revoke all on function public.submit_offer(uuid, numeric, text) from public;
grant execute on function public.submit_offer(uuid, numeric, text) to authenticated;

-- Offers are written only via the RPC now (rate limit). SELECT stays open to
-- participants; the transition RPCs already own the UPDATE/DELETE surface.
revoke insert on public.offers from authenticated;

-----------------------------------------------------------------------------
-- 2. record_contact_attempt RPC (rate-limited contact audit log)
-----------------------------------------------------------------------------
create or replace function public.record_contact_attempt(
  p_contact_method public.contact_method,
  p_seller_id uuid,
  p_listing_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
  v_recent integer;
begin
  v_buyer := auth.uid();
  if v_buyer is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  -- The target seller must exist (no forging audit rows for arbitrary ids).
  if not exists (select 1 from public.profiles where id = p_seller_id) then
    return jsonb_build_object('ok', false, 'error', 'seller not found');
  end if;

  -- If a listing context is given, it must exist.
  if p_listing_id is not null and not exists (
    select 1 from public.listings where id = p_listing_id
  ) then
    return jsonb_build_object('ok', false, 'error', 'listing not found');
  end if;

  -- Rate limit: max 20 contact attempts per buyer per seller within an hour.
  select count(*) into v_recent
  from public.contact_attempts
  where seller_id = p_seller_id
    and buyer_id = v_buyer
    and created_at > now() - interval '1 hour';
  if v_recent >= 20 then
    return jsonb_build_object('ok', false, 'error', 'rate limit exceeded, please wait before contacting this seller again');
  end if;

  insert into public.contact_attempts (contact_method, seller_id, listing_id, buyer_id)
  values (p_contact_method, p_seller_id, p_listing_id, v_buyer);

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

revoke all on function public.record_contact_attempt(public.contact_method, uuid, uuid) from public;
grant execute on function public.record_contact_attempt(public.contact_method, uuid, uuid) to authenticated;

-- Contact attempts are written only via the RPC now (rate limit + target check).
revoke insert on public.contact_attempts from authenticated;

-----------------------------------------------------------------------------
-- 3. listing_images UPDATE policy: add the missing `with check`
-----------------------------------------------------------------------------
drop policy if exists "Listing images are updatable by the listing owner"
  on public.listing_images;

create policy "Listing images are updatable by the listing owner"
  on public.listing_images for update
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and l.seller_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and l.seller_id = (select auth.uid())
    )
  );