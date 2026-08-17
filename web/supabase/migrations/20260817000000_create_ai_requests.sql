-- #69 (parent #68) - shared, DB-backed AI request limiter.
-- Audit P0.5: the AI listing-assistant seam limited Gemini calls with an
-- in-memory per-process array (lib/ai/listings.ts), so on the serverless
-- target each function instance kept its own window and anon callers could
-- consume Gemini quota. The action now requires seller auth (requireSeller)
-- and file validation, and the limiter moves out of process memory into
-- Postgres so the window is shared across instances.
--
-- Mirrors the security-hardening RPC pattern (20260815000000): a SECURITY
-- DEFINER function enforces a windowed count, and direct table inserts are
-- revoked so the limit cannot be bypassed. The AI rate limit is non-gating
-- (NFR-AI-003): a miss degrades to manual listing.
--
-- The 60s window is enforced DB-side; the per-call limit (AI_RATE_LIMIT env,
-- default 10) is passed from the app but capped server-side at 100 so a client
-- can lower it (tests, runtime overrides) but never raise it — the shared
-- window cannot be inflated or write-amplified via a huge p_limit.

create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ai_requests_created_at_idx
  on public.ai_requests (created_at);

------------------------------------------------------------------------------
-- RLS: admins may audit AI usage; no per-user read surface is exposed yet.
-- Inserts happen only through record_ai_request (see revoke below).
------------------------------------------------------------------------------
alter table public.ai_requests enable row level security;

create policy "AI requests are readable by admins"
  on public.ai_requests for select
  to authenticated
  using (public.is_admin());

------------------------------------------------------------------------------
-- record_ai_request(p_limit) - windowed AI call limiter.
-- Returns {allowed: bool, error: text | null}. Enforces a sliding 60s window
-- (global, across all sellers) of at most p_limit forwarded requests, then
-- records the call as the counting row.
------------------------------------------------------------------------------
create or replace function public.record_ai_request(
  p_limit integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_limit integer;
  v_recent integer;
begin
  v_user := auth.uid();
  if v_user is null then
    return jsonb_build_object('allowed', false, 'error', 'not authenticated');
  end if;

  -- AI assist is a seller-only surface (create-listing form; ADR-020 keeps
  -- admins moderation-only). The app gates with requireSeller; the RPC enforces
  -- the same rule so no other role can drive the shared window.
  if not exists (
    select 1 from public.profiles where id = v_user and role = 'seller'
  ) then
    return jsonb_build_object('allowed', false, 'error', 'not a seller');
  end if;

  -- Server-side cap: the caller may lower the budget (AI_RATE_LIMIT env, tests)
  -- but never raise it past the ceiling, so the shared window stays bounded.
  v_limit := greatest(least(coalesce(p_limit, 10), 100), 1);

  select count(*) into v_recent
  from public.ai_requests
  where created_at > now() - interval '60 seconds';

  if v_recent >= v_limit then
    return jsonb_build_object('allowed', false, 'error', 'rate limit exceeded, please try again shortly');
  end if;

  insert into public.ai_requests (user_id)
  values (v_user);

  return jsonb_build_object('allowed', true, 'error', null);
end;
$$;

revoke all on function public.record_ai_request(integer) from public;
grant execute on function public.record_ai_request(integer) to authenticated;

-- AI requests are written only via the RPC now (shared rate limit).
revoke insert on public.ai_requests from authenticated;
grant select on public.ai_requests to authenticated;