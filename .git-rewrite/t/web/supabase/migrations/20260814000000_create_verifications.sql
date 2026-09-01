-- T12 - Verification & trust badges
-- trust badges + seller verification, per docs/02-architecture/03-database-design-specification.md
-- §15 (verifications), §20 (RLS: users view own verification records,
-- admins/system services update), §21 (soft delete); docs/02-architecture/
-- 02-domain-model.md (INV-009: verification records immutable after approval;
-- §10 Trust Score Service: verification is a trust input -> VerificationApproved
-- increases Trust Score); docs/02-architecture/07-security-architecture.md §16 (rate
-- limiting the request path); and issue #16 AC.
--
-- Scope: the write/audit surface (verifications table + the admin
-- record_verification RPC) plus a denormalized read model on `profiles` so the
-- badge set renders cheaply on every seller surface (browse, favorites, search,
-- listing detail, seller profile) without per-row RPC calls. DB spec §15 is the
-- source of truth; the profile flags are a cached projection, updated only by
-- record_verification (the same SECURITY DEFINER, audited-write pattern as T10's
-- submit_review), so they cannot drift from the verifications log.
--
-- Badges (AC-1) are derived from profile state, which the read policies below
-- expose publicly (phone is the only masked column, per T03):
--   * "Verified Seller" shield  = profiles.role = 'seller' (onboarded to sell)
--   * "Phone Verified"          = profiles.phone_verified
--   * "Fayda Verified"          = profiles.fayda_verified (placeholder, AC-1)
-- `verified_seller` is intentionally NOT a separate column: the existing
-- role='seller' already represents an approved-seller account (INV-001/INV-004
-- ownership model), so a seller IS the verified-seller badge. A profile with
-- role='buyer' (or one with no flags) renders the "Not verified yet" empty state.

create type public.verification_type as enum ('email', 'phone', 'telegram', 'fayda');
create type public.verification_status as enum ('pending', 'verified', 'rejected');

create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.verification_type not null,
  status public.verification_status not null default 'pending',
  verifier_id uuid references auth.users (id), -- admin/system agent who acted
  verified_at timestamptz,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists verifications_user_id_idx on public.verifications (user_id);
create index if not exists verifications_type_idx on public.verifications (type);
create index if not exists verifications_status_idx on public.verifications (status);
-- One live verification per (user, type): re-verifying supersedes the prior row.
create unique index if not exists verifications_one_active_per_type
  on public.verifications (user_id, type)
  where status in ('pending', 'verified') and deleted_at is null;

create trigger verifications_set_updated_at
  before update on public.verifications
  for each row execute function public.handle_updated_at();

------------------------------------------------------------------------------
-- Denormalized read model on profiles (cached projection of verified types).
-- Defaults keep existing rows consistent; the trigger-free flag is only ever
-- written by record_verification, which also writes the audit row above.
------------------------------------------------------------------------------
alter table public.profiles
  add column if not exists phone_verified boolean not null default false,
  add column if not exists fayda_verified boolean not null default false;

------------------------------------------------------------------------------
-- RLS (DB spec §20 Verifications): a user reads their own verification records;
-- only admins/system services update them. There is no public read of
-- verifications (they are private signals that surface as the public profile
-- flags below), so no anon select policy is granted.
------------------------------------------------------------------------------
alter table public.verifications enable row level security;

create policy "Users read their own non-deleted verification records"
  on public.verifications for select
  to authenticated
  using ((select auth.uid()) = user_id and deleted_at is null);

-- No client INSERT/UPDATE/DELETE policies: the SECURITY DEFINER
-- record_verification RPC (admin-gated) is the sole writer, so an approved
-- record can never be mutated (INV-009). Admins read the full audit trail,
-- including superseded rows, but never touch verified rows' status directly.
create policy "Admins read verification records"
  on public.verifications for select
  to authenticated
  using (public.is_admin() and deleted_at is null);

------------------------------------------------------------------------------
-- record_verification: the audited admin write path (Modération Context owns
-- verifications). Per-DB-§21, the prior live verification row for (user, type)
-- is soft-deleted first (its status is never mutated, so an approved record is
-- immutable in place per INV-009). It then inserts a fresh audit row, sets
-- verified_at on approval, flips the denormalized profile flag, and — per
-- VerificationApproved -> Increase Trust Score (domain model §9 / §10) — bumps
-- profiles.trust_score, clamped to 0-100. Rejecting unsets the flag so a
-- rescinded verification can't linger as a public badge.
--
-- NOTE on trust composition: T10's submit_review sets trust_score from the
-- rating average; T12 increments it here on verification. Both are T12-scoped
-- contributions to the single trust_score column; the unified Trust Score
-- Service (design §34, "Future Component") will eventually compose ratings +
-- verification + reports + profile completion + sales rather than each feature
-- writing the column independently.
------------------------------------------------------------------------------
create or replace function public.record_verification(
  p_user_id uuid,
  p_type public.verification_type,
  p_status public.verification_status,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta int := 0;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'admin only');
  end if;
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'user id is required');
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    return jsonb_build_object('ok', false, 'error', 'profile not found');
  end if;
  if p_notes is not null and char_length(p_notes) > 2000 then
    return jsonb_build_object('ok', false, 'error', 'notes are too long');
  end if;

  -- One live verification per (user, type). A re-verification issues a fresh
  -- audit row; the prior live row is soft-deleted FIRST (its status stays
  -- immutable per INV-009, so an approved record is never "un-approved" in
  -- place) so the one-live-per-type index no longer counts it when we insert.
  update public.verifications
    set deleted_at = now()
    where user_id = p_user_id
      and type = p_type
      and deleted_at is null;

  insert into public.verifications (user_id, type, status, verifier_id, verified_at, notes)
  values (p_user_id, p_type, p_status, (select auth.uid()),
          case when p_status = 'verified' then now() end, nullif(p_notes, ''));

  if p_type = 'phone' then
    update public.profiles set phone_verified = (p_status = 'verified') where id = p_user_id;
    v_delta := 10;
  elsif p_type = 'fayda' then
    update public.profiles set fayda_verified = (p_status = 'verified') where id = p_user_id;
    v_delta := 20;
  end if;

  -- VerificationApproved / rejection: nudge the trust score for the verified
  -- contribution, leaving ratings' overwrite to T10 as documented above.
  if v_delta <> 0 then
    update public.profiles
      set trust_score = (
        case
          when p_status = 'verified' then least(trust_score + v_delta, 100)
          when p_status = 'rejected' then greatest(trust_score - v_delta, 0)
          else trust_score
        end
      )
      where id = p_user_id;
  end if;

  return jsonb_build_object('ok', true, 'error', null, 'user_id', p_user_id, 'type', p_type);
end;
$$;

------------------------------------------------------------------------------
-- Extend the public search RPC (T06) to expose seller verification flags so
-- search-result listing cards render the same badge set as browse/favorites.
-- The return type changes (two added columns), so the old function must be
-- dropped before re-creating; the EXECUTE grants are re-applied below.
drop function if exists public.search_listings(text, text, numeric, numeric, public.listing_condition, text, text, int, int);
create or replace function public.search_listings(
  p_query text default null,
  p_category_slug text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_condition public.listing_condition default null,
  p_city text default null,
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

grant usage on schema public to anon, authenticated;
-- Verifications are private: only readable via the profile flags (which the
-- public profile read policy already exposes) or directly by admins/owners.
-- Clients never write verifications directly — only the SECURITY DEFINER
-- record_verification RPC (admin-gated) inserts, so an approved record is
-- immutable in place (INV-009). SELECT is gated by the RLS policies above.
grant select on public.verifications to authenticated;

-- RPC grants: authenticated-only (verifications are admin/owner scoped), keeping
-- the implicit EXECUTE from public so the admin function isn't callable anon.
revoke all on function public.record_verification(uuid, public.verification_type, public.verification_status, text) from public;
grant execute on function public.record_verification(uuid, public.verification_type, public.verification_status, text) to authenticated;
revoke all on function public.search_listings(text, text, numeric, numeric, public.listing_condition, text, text, int, int) from public;
grant execute on function public.search_listings(text, text, numeric, numeric, public.listing_condition, text, text, int, int) to anon, authenticated;
