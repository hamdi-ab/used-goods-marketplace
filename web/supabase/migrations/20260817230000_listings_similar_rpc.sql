-- P1.10 / #78: "Similar Listings" section on the detail page (PRD US-010,
-- IA §11.9). Returns published, non-deleted listings in the SAME category as
-- the source listing whose price is within +/-50% of the source price, newest
-- first, excluding the source itself.
--
-- Reuses the flat read shape surfaced by search_listings (see
-- 20260813000000_search_listings_rpc.sql) so the same `mapFlatSearchListing`
-- client seam renders both, and mirrors its security posture:
--   * SECURITY DEFINER with a locked-down search_path so the function body
--     cannot be hijacked by a malicious schema.
--   * WHERE clause mirrors the public-read RLS policy (status = 'published'
--     and deleted_at is null) and only joins columns that are already
--     publicly readable (profiles: T03 public read policy, categories,
--     listing_images) — the definer therefore exposes nothing the anon
--     browse path already exposes.
--   * EXECUTE granted only to anon, authenticated (NOT public-at-large).

create or replace function public.listings_similar(
  p_listing_id uuid,
  p_limit int default 6,
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
language sql
security definer
as $func$
  with source as (
    select l.category_id, l.price
    from public.listings l
    where l.id = p_listing_id
      and l.status = 'published'
      and l.deleted_at is null
  )
  select
    l.id,
    l.title,
    l.price,
    l.condition,
    l.city,
    l.published_at,
    im.image_url,
    coalesce(ic.image_count, 0)::bigint,
    c.name as category_name,
    c.slug as category_slug,
    u.id as seller_id,
    u.full_name as seller_full_name,
    u.avatar_url as seller_avatar_url,
    u.role as seller_role,
    u.trust_score::int as seller_trust_score,
    u.phone_verified as seller_phone_verified,
    u.fayda_verified as seller_fayda_verified,
    count(*) over ()::bigint as total_count
  from public.listings l
  cross join source s
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
    and l.category_id = s.category_id
    and l.id <> p_listing_id
    -- US-010 AC: "similar price range" -> within +/-50% of the source price.
    and l.price between s.price * 0.5 and s.price * 1.5
  order by l.published_at desc
  limit p_limit offset p_offset
$func$;

revoke all on function public.listings_similar(uuid, int, int) from public;
grant execute on function public.listings_similar(uuid, int, int) to anon, authenticated;
