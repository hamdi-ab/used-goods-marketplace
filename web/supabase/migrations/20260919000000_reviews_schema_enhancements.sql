-- T144-T146: Reviews schema enhancements
-- #144: Add source column to reviews (organic vs demo distinction)
-- #145: Add review_responses table (seller can respond once per review)
-- #146: Add review_violation to report_reason enum

-- 1. Add source column to reviews table
alter table public.reviews
  add column if not exists source text not null default 'organic'
  check (source in ('organic', 'demo'));

-- 2. Create review_responses table
create table if not exists public.review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);

alter table public.review_responses
  add constraint review_responses_comment_length
  check (char_length(comment) between 1 and 1000);

-- Index for seller's responses and review lookup
create index if not exists review_responses_seller_id_idx on public.review_responses (seller_id);
create index if not exists review_responses_review_id_idx on public.review_responses (review_id);

-- RLS: seller can read their own responses; public can read all
alter table public.review_responses enable row level security;

create policy "Review responses are publicly readable"
  on public.review_responses for select
  to authenticated, anon
  using (true);

create policy "Sellers can insert their own response"
  on public.review_responses for insert
  to authenticated
  with check (seller_id = (select auth.uid()));

-- 3. Add review_violation to report_reason enum
alter type public.report_reason add value if not exists 'review_violation' after 'offensive_content';

-- 4. Add review_id to reports table (for review-specific reports)
alter table public.reports
  add column if not exists review_id uuid references public.reviews (id) on delete set null;

-- Grant select on review_responses
grant select on public.review_responses to authenticated, anon;

-- Re-define submit_review to accept p_source (now that source column exists)
drop function if exists public.submit_review(uuid, smallint, text);

create or replace function public.submit_review(p_offer_id uuid, p_rating smallint, p_comment text, p_source text default 'organic')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
  v_listing public.listings;
  v_seller_id uuid;
  v_rows integer;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    return jsonb_build_object('ok', false, 'error', 'rating must be between 1 and 5');
  end if;
  if p_comment is not null and char_length(p_comment) > 1000 then
    return jsonb_build_object('ok', false, 'error', 'comment is too long');
  end if;

  select * into v_offer from public.offers where id = p_offer_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'offer not found');
  end if;

  if v_offer.status <> 'accepted' or v_offer.buyer_id <> (select auth.uid()) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  select * into v_listing from public.listings where id = v_offer.listing_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'listing not found');
  end if;
  v_seller_id := v_listing.seller_id;

  insert into public.reviews (offer_id, seller_id, buyer_id, rating, comment, source)
  values (p_offer_id, v_seller_id, v_offer.buyer_id, p_rating, nullif(p_comment, ''), coalesce(p_source, 'organic'))
  on conflict (offer_id) do nothing;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'error', 'offer already reviewed');
  end if;

  update public.profiles
    set trust_score = (
      select round(avg(rating) * 20)::smallint
      from public.reviews where seller_id = v_seller_id and source = 'organic'
    )
    where id = v_seller_id;

  return jsonb_build_object('ok', true, 'error', null, 'seller_id', v_seller_id);
end;
$$;

revoke all on function public.submit_review(uuid, smallint, text, text) from public;
grant execute on function public.submit_review(uuid, smallint, text, text) to authenticated;

-- 5. submit_review_response: seller responds to a review (one response per review)
create or replace function public.submit_review_response(p_review_id uuid, p_comment text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review public.reviews;
  v_listing public.listings;
  v_rows integer;
begin
  if p_comment is null or char_length(trim(p_comment)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'comment is required');
  end if;
  if char_length(p_comment) > 1000 then
    return jsonb_build_object('ok', false, 'error', 'comment is too long');
  end if;

  select * into v_review from public.reviews where id = p_review_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'review not found');
  end if;

  -- Only the seller of the reviewed listing may respond
  select * into v_listing from public.listings where id = (
    select listing_id from public.offers where id = v_review.offer_id
  );
  if not found or v_listing.seller_id <> (select auth.uid()) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  insert into public.review_responses (review_id, seller_id, comment)
  values (p_review_id, (select auth.uid()), trim(p_comment))
  on conflict (review_id) do nothing;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'error', 'already responded');
  end if;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

revoke all on function public.submit_review_response(uuid, text) from public;
grant execute on function public.submit_review_response(uuid, text) to authenticated;

-- 6. remove_review: admin removes a review for violation, recomputes trust score
create or replace function public.remove_review(p_review_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review public.reviews;
  v_seller_id uuid;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  select * into v_review from public.reviews where id = p_review_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'review not found');
  end if;

  v_seller_id := v_review.seller_id;

  delete from public.reviews where id = p_review_id;

  -- Recompute trust score after removal (organic reviews only)
  update public.profiles
    set trust_score = (
      select coalesce(round(avg(rating) * 20)::smallint, 50)
      from public.reviews where seller_id = v_seller_id and source = 'organic'
    )
    where id = v_seller_id;

  return jsonb_build_object('ok', true, 'error', null, 'seller_id', v_seller_id);
end;
$$;

revoke all on function public.remove_review(uuid, text) from public;
grant execute on function public.remove_review(uuid, text) to authenticated;
