-- #70 (parent #68) - close the anonymous profiles phone leak.
-- Wayfinder decision #88 (research: docs/agents/research/01-profiles-phone-rls-fix.md).
--
-- Problem: the T03 `using (true)` policy opened every profiles row to anon, and
-- the T02 `grant select on public.profiles to anon` made every column readable,
-- `phone` included. The app gated phone at the data-access layer, but the
-- database itself leaked it (Security spec 2 defense in depth, 37 zero trust,
-- 19/39 phone private by default).
--
-- Fix (option a from the research, with one necessary addition):
--   1. `profiles_public` is the canonical public surface - a security-definer
--      view (Postgres view default) projecting only the Security 19 public
--      columns. Explicit app reads of other users' profiles move to it.
--   2. The base table's table-level SELECT is revoked from anon, then
--      re-granted column-level for exactly the view's projection. PostgREST
--      embeds a relation through foreign keys and cannot target a view, so the
--      anonymous browse/detail seller joins (lib/listings.ts) keep working via
--      the column grant while `phone` stays unreachable. This is the Postgres
--      docs pattern (column-granted SELECT + view for relational access) the
--      research cites approvingly.
--      Trade-off: the column grant is row-agnostic, so anon can still read the
--      public columns of soft-deleted profiles straight from the base table
--      (the view's deleted_at filter only governs the view). Phone is excluded,
--      so the leak stays closed; accepted for the FK-join seam.
--
-- Result: `phone` is enforced at the DB boundary, not by app convention. Anon
-- `select phone from profiles` -> permission denied; `select *` returns only
-- the granted public columns. The app-layer gate stays on top as a second
-- defense. The T03 `using (true)` policy is left in place (it still gates rows
-- for authenticated reads); it can be superseded by a later tightening.

create or replace view public.profiles_public as
  select id, full_name, avatar_url, city, sub_city, bio, telegram_username,
         trust_score, role, phone_public, phone_verified, fayda_verified
  from public.profiles
  where deleted_at is null;

revoke select on table public.profiles from anon;

grant select (id, full_name, avatar_url, city, sub_city, bio, telegram_username,
              trust_score, role, phone_public, phone_verified, fayda_verified)
  on table public.profiles to anon;

grant select on public.profiles_public to anon, authenticated;