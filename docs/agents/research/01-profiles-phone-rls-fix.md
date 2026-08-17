# Profiles Phone/RLS Leak — Fix Decision Research

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Owner:** Security & Backend Team
>
> **Status:** Research — resolves wayfinder #88 (parent #87)

## 1. The exact leak mechanism

Two migrations compose the hole. RLS is enabled on `profiles`, but the grant + policy make **every** column readable by anonymous users, `phone` included, with no row-level consent check.

| Artifact | File | Lines | What it does |
|---|---|---|---|
| T02 grant | `web/supabase/migrations/20260812000000_create_profiles.sql` | 120 | `grant select on table public.profiles to anon;` — gives anon the table-level SELECT privilege. |
| T02 row policy (owner-only) | `...20260812000000_..._create_profiles.sql` | 82–85 | `"Profiles are selectable by the owner" … to authenticated using ((select auth.uid()) = id);` — restricts *rows* to the authenticated owner. |
| T03 "public" row policy | `web/supabase/migrations/20260812120000_profile_phone_public.sql` | 18–21 | `create policy "Profiles are publicly readable" on public.profiles for select to authenticated, anon using (true);` — opens **all rows** to anonymous. |

The contradiction: T02 grants `anon` SELECT and T03 adds a `using (true)` policy tagged `to … anon`. Per the Supabase RLS docs, a row policy is an *implicit WHERE clause* on **rows**, not **columns** — it does not mask columns. So an anonymous request such as `select * from profiles` (or the Supabase client `.from('profiles').select()`) runs with anon's table privilege, the `using (true)` policy passes every row, and Postgres returns the full row including `phone`, `telegram_username`, `sub_city`, `bio`, etc.

The `phone_public` opt-in flag is enforced **only** at the data-access layer:

- `lib/profiles.ts:78–82` — `fetchPublicProfile` selects `PUBLIC_PROFILE_COLUMNS` (line 43) which omits `phone`; the opt-in `phone` is fetched in a **second** query (`lib/profiles.ts:88–95`) only `if (row.phone_public)`.
- `lib/contact.ts:31–47` — `fetchSellerContactInfo` selects `telegram_username, phone_public` only, then pulls `phone` separately gated on `phone_public`.

So the app code is "safe by convention": it never asks for `phone` unless the owner consented. But the **database offers no enforcement** — any other caller (a new RPC, an admin query in Studio, a future "seller-listings API", or a careless `select phone`, `select *`) bypasses the app-layer gate entirely. The migration's own comment (`profile_phone_public.sql:14–17`) states this explicitly: *"Postgres has no column-level RLS, so phone exposure is gated at the data-access layer."*

Net effect: **phone is already leaking now** to anonymous, not merely at future risk. `select * from profiles` as `anon` returns every phone number. This violates Security-spec §2 (Defense in Depth), §37 (Zero Trust), and the §19/§39 privacy rule that *"phone is private by default"* and *"must not be exposed publicly without user consent."*

Secondary: `profiles_phone_idx` (`20260812000000_create_profiles.sql:24`) enables existence/timing signals for a registered phone (minor).

## 2. Options compared

### Option (a) — `profiles_public` view + revoke anon SELECT on base table

A `security_definer` (the Postgres default for views) view that projects **only** the public surface, plus revoking the `anon` grant on the base table so anonymous reads can *only* go through the view.

Implementation sketch (new migration, downstream of T03):

```sql
-- Curated public surface per Security §19 ("Display name, Avatar, City,
-- Trust indicators") plus the opt-in/verification flags the public profile
-- page already renders. phone/ is deliberately absent.
create or replace view public.profiles_public as
  select
    id,
    full_name,
    avatar_url,
    city,
    sub_city,
    bio,                 -- public bio per current page surface
    telegram_username,   -- currently treated as public by the app (see §5)
    trust_score,
    role,
    phone_public,
    phone_verified,
    fayda_verified
  from public.profiles
  where deleted_at is null;

-- Hard boundary: anon can no longer hit the base table directly.
revoke select on table public.profiles from anon;
grant select on public.profiles_public to anon, authenticated;
```

App changes (two files only):

- `lib/profiles.ts:78` — `fetchPublicProfile` selects from `profiles_public` instead of `profiles`; the column list already equals the view's projection (minus `phone`, which it already omits), so the first query is a drop-in; **keep** `lib/profiles.ts:88–95` (the opt-in `phone` second-query against the base table — still allowed for the authenticated owner by the T02 owner policy; anon can no longer reach it).
- `lib/contact.ts:31–33` — `fetchSellerContactInfo` first query selects `telegram_username, phone_public` from `profiles_public`; keep the opt-in `phone` pull from the base table (`lib/contact.ts:40–46`) gated on `phone_public`.

Verification: anon doing `select * from profiles` → `permission denied` (grant revoked). Anon doing `select phone from profiles_public` → empty column / error (phone not projected). Anon doing `select * from profiles_public` → only the curated public columns. Phone is now enforced at the DB boundary.

Trade-offs:
- **Pro:** single source of truth for the public surface; moves enforcement out of "every future developer writes the query correctly" (app-layer convention) into the data layer; matches Postgres' own recommended pattern (the docs' `passwd` example grants `SELECT (col_list)` to public and uses a view for relational access). Strong alignment with Security §2 (Defense in Depth) — the app-layer gating remains on top as a second defense.
- **Pro:** zero new per-column grants or policies; one view + two grants.
- **Con:** `security_definer` runs as the view owner (postgres) and bypasses RLS on the underlying table. This is *intended and safe here* because the view projects a fixed public column set and `phone` is excluded; the Supabase docs' caveat about views bypassing RLS is mitigated by the explicit column curation. Must be created in the exposed `public` schema with the minimal grant (`SELECT` only).
- **Con:** `security_invoker = true` (Postgres 15+) is *not* viable for the anon read path, because it would force keeping the anon base-table grant so the view's underlying query can pass — which re-opens the `select * from profiles` leak. So the default `security_definer` is the right choice.

### Option (b) — column-level RLS

**Not available in Postgres/Supabase.** The PostgreSQL 5.9 Row Security Policies doc (fetched) describes policies controlling *rows* and *commands* (SELECT/INSERT/UPDATE/DELETE) — there is no column-scoped row policy. The doc's `passwd` example achieves column confidentiality with **static column-level GRANTs** (`GRANT SELECT (user_name, uid, …) ON passwd TO public;`), which are all-or-nothing **per role across all rows** — they cannot express "phone visible to anon only when `phone_public = true`." The codebase's own T03 migration comment (`profile_phone_public.sql:14`) confirms this: *"Postgres has no column-level RLS."*

So option (b) as literally named does not exist; the closest real Postgres feature (column-level GRANT) is static per-role and cannot encode the consent gate, and would itself reduce to "exclude `phone` from the anon column grant" — i.e. it becomes a variant of (a) plus column grants, adding complexity without the row-conditional opt-in. **Dismiss as infeasible.**

### Option (c) — keep app-layer gating + document residual risk

This is the current state (app code already omits `phone` from public reads and gates the opt-in pull on `phone_public`).

- **Pro:** zero migration/app work today.
- **Con:** the database actively permits the leak *now* — `select * from profiles` and `.from('profiles').select()` as anon return phone — so "residual risk" is already realized, not hypothetical. It re-violates Security §2/§37 for every future caller (RPCs, admin tooling, the Data API, new features) and depends on every future developer reproducing the exact discipline of `fetchPublicProfile`/`fetchSellerContactInfo`.
- **Con:** "document the risk" is not a control; it does not satisfy the §19/§39 privacy-by-default obligation or a security review checklist.

## 3. Recommendation

**Option (a)** — introduce `profiles_public` (`security_definer`, projecting only `full_name, avatar_url, city, sub_city, bio, telegram_username, trust_score, role, phone_public, phone_verified, fayda_verified`) and `revoke select on public.profiles from anon; grant select on public.profiles_public to anon, authenticated;`, then point `fetchPublicProfile` and `fetchSellerContactInfo` at the view for their public-column reads while retaining the existing opt-in `phone` second-query (now additionally protected at the DB layer because anon lacks the base-table grant).

Reasoning: (a) is the only option that enforces column confidentiality **at the data boundary** instead of relying on app-layer convention; (b) is infeasible (no native per-column row RLS — it collapses into (a) anyway); (c) leaves a live, ongoing leak and no real control. It is a strict improvement — the existing app-layer gating stays in place as defense in depth on top of the new DB-layer boundary.

## 4. Concrete next-step changes (for the implementing ticket)

Migration (new file `web/supabase/migrations/20260815000000_profiles_public_view.sql`):
```sql
-- T03 follow-up (wayfinder #88): close the anon profiles RLS leak.
-- profiles_public exposes only the §19 public surface to anon; the base
-- table is no longer readable by anon, so phone/telegram/sensitive columns
-- are unreachable without a phone_public opt-in (app-layer gating retained).
create or replace view public.profiles_public as
  select id, full_name, avatar_url, city, sub_city, bio, telegram_username,
         trust_score, role, phone_public, phone_verified, fayda_verified
  from public.profiles
  where deleted_at is null;

revoke select on table public.profiles from anon;
grant select on public.profiles_public to anon, authenticated;
```

App:
- `web/lib/profiles.ts:78` → `.from("profiles_public").select(PUBLIC_PROFILE_COLUMNS)` (same column list; no other change; lines 88–95 opt-in `phone` query stays).
- `web/lib/contact.ts:31` → `.from("profiles_public").select("telegram_username, phone_public")` (lines 40–46 opt-in `phone` pull stays).

## 5. Notes / open items

- **telegram_username exposure:** Security §19 lists "Public profile: Display name, Avatar, City, Trust indicators" and §35–37 lists telegram under Optional data that *"must not be exposed publicly without user consent"* (§39). The app currently renders telegram publicly on `app/(site)/users/[id]/page.tsx:96–121` without a consent gate. This view fix **preserves current behavior** by including `telegram_username` in the curated projection; if telegram should also be consent-gated, add a `telegram_public` flag and drop it from the view — that is a product decision, out of scope for the leak fix but now trivially expressible.
- **RLS policy cleanup:** once the view is the anon/read surface, the `"Profiles are publicly readable … using (true)"` policy in `20260812120000_profile_phone_public.sql:18–21` becomes redundant for the public surface; it can be removed/superseded in a later migration (it still governs the table directly and is harmless, but removing it tightens the model).
- **pgTAP coverage:** `tests/unit/profiles.test.ts` and `tests/unit/contact.test.ts` already assert the phone-private-by-default behavior; add an RLS test asserting `anon` cannot `select` from `profiles` and that `phone` is absent from `profiles_public`.
