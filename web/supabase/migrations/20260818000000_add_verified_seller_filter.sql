-- #79 P1.10: Verified-Seller filter facet.
--
-- Adds a `p_verified_seller boolean default null` parameter to `search_listings`
-- that, when supplied, restricts results to listings whose seller carries the
-- "Verified Seller" badge. Per `lib/verifications/constants.ts` that badge is
-- `profiles.role = 'seller'` (a live role, distinct from the future-only Fayda
-- badge, so the facet does NOT filter on fayda_verified).
-- null = no filter (backwards compatible with the existing call site and the
-- industry-audit #12 deviation note).
--
-- The function body is otherwise unchanged from its definition in
-- 20260814000000_create_verifications.sql (which exposed
-- `seller_fayda_verified`); only the signature + a where-clause term change.

drop function if exists public.search_listings(text, text, numeric, numeric, public.listing_condition, text, text, int, int);
create or replace function public.search_listings(
  p_query text default null,
  p_category_slug text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_condition public.listing_condition default null,
  p_city text default null,
  p_verified_seller boolean default null,
  p_sort text default 'newest',
  p_limit int default 12,
  p_offset int default 0
)
returns table (
  id uuid,
  title text,
  price numeric,
  condition public.listing_condition,
  city text,
  published_at timestamptz,
  image_url text,
  image_count bigint,
  category_name text,
  category_slug text,
  seller_id uuid,
  seller_full_name text,
  seller_avatar_url text,
  seller_role text,
  seller_trust_score int,
  seller_phone_verified boolean,
  seller_fayda_verified boolean,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tsq tsquery;
  v_limit int;
  v_offset int;
begin
  if p_sort not in ('newest', 'oldest', 'price_asc', 'price_desc') then
    p_sort := 'newest';
  end if;

  v_limit := least(greatest(p_limit, 0), 1000);
  v_offset := least(greatest(p_offset, 0), 1000 - v_limit);

  if p_query is not null and btrim(p_query) <> '' then
    v_tsq := websearch_to_tsquery('simple', btrim(p_query));
  else
    v_tsq := null;
  end if;

  return query
  select
    l.id,
    l.title,
    l.price,
    l.condition,
    l.city,
    l.published_at,
    im.image_url,
    coalesce(ic.image_count, 0)::bigint,
    c.name,
    c.slug,
    u.id,
    u.full_name,
    u.avatar_url,
    u.role,
    u.trust_score::int,
    u.phone_verified,
    u.fayda_verified,
    count(*) over ()::bigint
  from public.listings l
  left join public.categories c on c.id = l.category_id
  left join public.profiles u on u.id = l.seller_id
  left join lateral (
    select i.image_url
    from public.listing_images i
    where i.listing_id = l.id
    order by i.display_order asc
    limit 1
  ) im on true
  left join lateral (
    select count(*) as image_count
    from public.listing_images i
    where i.listing_id = l.id
  ) ic on true
  where l.status = 'published'
    and l.deleted_at is null
    and (p_category_slug is null or c.slug = p_category_slug)
    and (p_min_price is null or l.price >= p_min_price)
    and (p_max_price is null or l.price <= p_max_price)
    and (p_condition is null or l.condition = p_condition)
    and (p_city is null or l.city ilike '%' || p_city || '%')
    and (p_verified_seller is null or u.role = 'seller')
    and (
      v_tsq is null
      or l.search_vector @@ v_tsq
      or l.title % p_query
    )
  order by
    case when p_sort = 'price_asc' then l.price end asc nulls last,
    case when p_sort = 'price_desc' then l.price end desc nulls last,
    case when p_sort = 'oldest' then l.published_at end asc nulls last,
    l.published_at desc
  limit v_limit
  offset v_offset;
end;
$$;

revoke all on function public.search_listings(text, text, numeric, numeric, public.listing_condition, text, boolean, text, int, int) from public;
grant execute on function public.search_listings(text, text, numeric, numeric, public.listing_condition, text, boolean, text, int, int) to anon, authenticated;
