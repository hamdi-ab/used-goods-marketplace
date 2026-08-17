-- #85 (parent #68) - global token-bucket rate limiter.
-- Audit P1.18: only offers (10/hr), reports (5/hr), contact (20/hr) and AI
-- (10/min) were limited; the API spec (§22 Rate Limiting, anon 100/hr,
-- auth 1000/hr) claims a global cap that no code enforced. Listing create/
-- update, favorites, reviews, profile updates and avatar uploads ran unlimited.
--
-- Fix: a `rate_usage` table + `consume_rate_budget` RPC, keyed by
-- auth.uid() (auth bucket) or a client fingerprint (anon bucket), enforced at
-- the action layer. Mirrors the security-hardening pattern (20260815000000):
-- a SECURITY DEFINER function owns the windowed count and direct inserts are
-- revoked so the limit cannot be bypassed. The window is 1 hour, matching the
-- spec. The per-call limit (p_limit) is capped server-side at the bucket
-- default so a caller can lower it (tests) but never raise it.

create table if not exists public.rate_usage (
  id uuid primary key default gen_random_uuid(),
  bucket_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_usage_bucket_key_created_at_idx
  on public.rate_usage (bucket_key, created_at);

------------------------------------------------------------------------------
-- RLS: admins may audit usage; no per-user read surface is exposed yet.
-- Inserts happen only through consume_rate_budget (see revoke below).
------------------------------------------------------------------------------
alter table public.rate_usage enable row level security;

create policy "Rate usage is readable by admins"
  on public.rate_usage for select
  to authenticated
  using (public.is_admin());

------------------------------------------------------------------------------
-- consume_rate_budget(p_limit, p_fingerprint) - global token bucket.
-- Returns {allowed: bool, error: text | null}. Enforces a sliding 1h window of
-- at most p_limit calls per bucket, then records the call as the counting row.
--   authenticated -> bucket `user:<auth.uid()>`, default 1000/hr (spec §22)
--   anon         -> bucket `anon:<p_fingerprint>`, default 100/hr (spec §22)
-- The fingerprint is the app's canonical UUID (web/lib/uuid.ts); it is
-- client-supplied only as a bucket key, never trusted for identity.
------------------------------------------------------------------------------
create or replace function public.consume_rate_budget(
  p_limit integer default null,
  p_fingerprint text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_bucket text;
  v_default integer;
  v_limit integer;
  v_recent integer;
begin
  v_user := auth.uid();

  if v_user is not null then
    v_bucket := 'user:' || v_user::text;
    v_default := 1000;
  else
    -- Anonymous bucket: a stable client fingerprint. Reject missing or
    -- malformed keys so a caller cannot spray arbitrary rows under distinct
    -- buckets to evade the cap.
    if p_fingerprint is null
       or p_fingerprint !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      return jsonb_build_object('allowed', false, 'error', 'missing anonymous fingerprint');
    end if;
    v_bucket := 'anon:' || lower(p_fingerprint);
    v_default := 100;
  end if;

  -- Server-side cap: the caller may lower the budget (tests, runtime overrides)
  -- but never raise it past the bucket default, so a bucket cannot be inflated
  -- or write-amplified via a huge p_limit.
  v_limit := greatest(least(coalesce(p_limit, v_default), v_default), 1);

  select count(*) into v_recent
  from public.rate_usage
  where bucket_key = v_bucket
    and created_at > now() - interval '1 hour';

  if v_recent >= v_limit then
    return jsonb_build_object('allowed', false, 'error', 'rate limit exceeded, please try again later');
  end if;

  insert into public.rate_usage (bucket_key)
  values (v_bucket);

  return jsonb_build_object('allowed', true, 'error', null);
end;
$$;

revoke all on function public.consume_rate_budget(integer, text) from public;
grant execute on function public.consume_rate_budget(integer, text) to anon;
grant execute on function public.consume_rate_budget(integer, text) to authenticated;

-- Rate usage is written only via the RPC now (global token bucket).
revoke all on table public.rate_usage from anon, authenticated;
