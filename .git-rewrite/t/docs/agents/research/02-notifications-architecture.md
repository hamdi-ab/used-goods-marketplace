# Notifications — MVP Architecture Decision

> **Project:** Used Goods Marketplace
> **Version:** 1.0
> **Owner:** Research (wayfinder #89)
> **Status:** Recommended — Option (a) In-App Realtime

## Decision

**Adopt option (a): a `notifications` table written by the existing SECURITY DEFINER RPCs, with Supabase Realtime Postgres Changes driving in-app toasts/badges and a GET/PATCH inbox.** Defer email (option b) to the "(Future)" channel the PRD reserves it for.

Option (b) email-only is rejected: it contradicts PRD Module 13 (In-App is the specced channel, Email is explicitly future), orphans the `notifications` table (DB spec §14) and `/notifications` endpoints (API spec §14) that already exist on paper, and requires a brand-new infra stack (Edge Function + email provider + deliverability tuning) the codebase has not touched — whereas option (a) reuses infrastructure already committed to (Supabase DB + Realtime + RLS) and extends the codebase's own SECURITY DEFINER RPC pattern.

## Event → Notification Mapping (PRD Module 13)

| PRD event | State change (RPC) | Recipient | Recipient resolved from |
|---|---|---|---|
| Offer Received | `submit_offer` inserts offer | listing seller | `offers.listing_id` → `listings.seller_id` |
| Offer Accepted | `accept_offer`: `offer.status=accepted`, `listing.sold` | offer buyer | `offers.buyer_id` |
| Offer Rejected | `decline_offer` on a pending offer | offer buyer | `offers.buyer_id` |
| Listing Sold | `accept_offer` stamps `sold_to_buyer_id` | listing seller | `offers.listing_id` → `listings.seller_id` |
| Listing Reported | `submit_report` inserts report | admin(s) | `auth.role()` / `public.is_admin()` |
| Listing Approved | admin moderation sets `listings.status='published'` | listing seller | `listings.seller_id` |
| Review Received | `submit_review` inserts review | review seller | `reviews.seller_id` (already returned by RPC) |

The three MVP events the prompt carves out (offer received, offer accepted, listing sold) sit on the existing offer RPCs; "review received" sits on `submit_review`. All are single-table or two-table writes already wrapped in one SECURITY DEFINER transaction.

## Wiring Points (option a — inline INSERT inside the RPC)

**Authoritative pattern:** the existing RPCs write multiple tables in one transaction as the function owner and re-derive actor identity from the session/rows, never from client input:
- `accept_offer` stamps `listings.sold_to_buyer_id` (offers migration `20260813110000_create_offers.sql:186-188`).
- `submit_review` inserts the review *and* recomputes `profiles.trust_score` in the same RPC (`20260813120000_create_reviews.sql:88-103`), returning `seller_id`.

**Recommended approach is to append a single `INSERT INTO notifications …` to the tail of each mutating RPC** (submit_offer, accept_offer, decline_offer, counter_offer, submit_review, submit_report, and the future listing-approval RPC). Rationale:
- Atomic with the state change — the notification row and the business event commit/roll back together (e.g. if `accept_offer` returns "listing is no longer available", no phantom "Offer Accepted" notification is left behind).
- Reuses the codebase's SECURITY DEFINER convention exactly; no new trigger-function ownership gymnastics.
- The client never writes notifications directly (see RLS below), so the only writers are the owner-role RPCs.

**Not recommended:** an AFTER TABLE trigger on `offers`/`reports`/`listings`. State-machine events (pending→accepted, inserted=pending=Offer Received) require OLD/NEW status diffing + TG_OP dispatch, and cross-table events (Listing Sold on an offer row) multiply into a fragile graph of triggers. The inline approach keeps event semantics in the one place that already owns them: the RPC.

## Trigger-Function / RPC Security (SECURITY DEFINER)

The notifications INSERT lives inside existing SECURITY DEFINER RPCs; the security contract they already follow carries over:

- Each RPC is `security definer set search_path = public` and resolves the actor via `auth.uid()` / `public.is_admin()` inside the body (`submit_report` does this at `20260813130000_create_reports.sql:100`; `accept_offer` checks seller/buyer/admin at `…create_offers.sql:166-174`). The notification recipient must be **derived from the mutated rows**, never from a caller-supplied id — e.g. insert the seller notification using `v_listing.seller_id`, the buyer notification using `v_offer.buyer_id`.
- The implicit `public` EXECUTE grant is revoked and EXECUTE is granted to `authenticated` only; this is already the convention (`revoke all on function … from public; grant execute … to authenticated` at `…create_offers.sql:285-290`, `…create_reviews.sql:114-115`, `…create_reports.sql:247-250`). No change needed for the new INSERT.
- `is_admin()` is defined in `20260812000000_create_profiles.sql:66` and is the canonical admin gate — keep using it for the Listing-Reported notification.
- The `notifications` table itself is **only written via the RPCs** (SECURITY DEFINER bypasses RLS on insert, as `accept_offer` already bypasses the offers UPDATE policy). Direct client INSERT/UPDATE/DELETE is blocked by revoking grants (`revoke all on public.notifications from public`) so a caller cannot forge a "review received" alert for another user.

## RLS Sketch (notifications table, DB spec §14)

The DB spec §14 already defines the row shape; RLS follows the codebase's authenticated+admin idiom:

```sql
-- DB spec §14 columns: id, user_id, type, title, body, is_read, metadata
alter table public.notifications enable row level security;

create policy "Users read their own notifications"
  on public.notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Notifications are manageable by admins"
  on public.notifications for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Writes are RPC-only (SECURITY DEFINER), never direct from the client:
revoke all on public.notifications from public;
grant usage on schema public to authenticated;
-- No INSERT/UPDATE/DELETE policy for authenticated: only the owner-role
-- RPCs insert. SELECT is gated above, so Realtime also respects this.
```

Indexing for the inbox + unread badge: `create index on public.notifications (user_id, is_read, created_at desc);` (mirrors `reviews_seller_created_idx` and `reports_created_at_idx`).

## Realtime Channel Shape (Postgres Changes)

Per `https://supabase.com/docs/guides/realtime/postgres-changes`:

1. **Publication:** the `notifications` table must be in the `supabase_realtime` publication — `alter publication supabase_realtime add table public.notifications;` (dashboard Public → tick `notifications`), exactly as the docs show adding a table to replication.
2. **Subscription:** scoped per-user with a server-side filter so only the recipient's rows leave Postgres:
```js
const channel = supabase
  .channel(`public:notifications:user_id=eq.${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,   // Realtime evaluates server-side
  }, (payload) => { /* sonner toast; bump unread badge */ })
  .subscribe();
```
3. **Delivery guarantee via RLS:** Realtime gates each deliverable against the recipient's SELECT policy. Because the policy is `auth.uid() = user_id`, an INSERT is delivered only to the row owner's channel — no cross-user leakage, and the unread-badge/inbox stay consistent with what the user can actually SELECT via `GET /notifications`.

## Client Surface (web/)

The PRD/API spec already name the contract; option (a) wires the UI the product already asked for:

- `useNotifications` hook: on authenticated mount, open the channel above; on `INSERT` payload, show a **sonner** toast (the existing UI lib is shadcn/ui + Tailwind; sonner is the toaster already in scope for non-blocking alerts) and invalidate the unread count. Cleanup = `supabase.removeChannel`. Mirror the dashboard's existing badge idiom (`dashboard/page.tsx:87-89` shows `openOfferCount`) for the unread badge.
- Unread badge: a lightweight `select count(*) … where user_id=uid and is_read is false` query (mirrors `countIncomingOffers` at `web/lib/offers.ts:165-181`), incremented live by the channel.
- Inbox page: `GET /notifications` (API spec §14) ordered by `created_at desc`; `PATCH /notifications/{id}` flips `is_read` (API spec §14) — RLS ensures a user can only mark-read their own rows.
- The existing `dashboard/page.tsx:87-89` alert is a **server-rendered count**, not a notification — it's a fine place to surface the unread-badge number as a parallel, lower-priority signal.

## Option (b) — Email-only (rejected for MVP)

- Would require an Edge Function + email provider + API-key management + deliverability tuning — a stack the repo has not initialized (no `functions/`, no email provider in `web/README.md`).
- Skips the PRD's primary channel (In-App) and the already-specified `notifications` table + `/notifications` endpoints, leaving spec docs uncorroborated.
- No read/unread state, no inbox, no toast — offline users simply miss the email, and there's no in-app audit trail. Email is correctly the "(Future)" channel per PRD Module 13; layer it onto (a) later by adding an email send at the tail of the same RPCs.

## Cross-References

- PRD Module 13 events & channels: `docs/01-prd/04-functional-requirements.md:364-376`
- notifications table (§14): `docs/02-architecture/03-database-design-specification.md:248-258`
- `/notifications` endpoints (§14): `docs/02-architecture/04-api-specification.md:458-474`
- Existing SECURITY DEFINER RPC pattern (offers): `web/supabase/migrations/20260813110000_create_offers.sql:138-191`
- Existing multi-statement RPC (reviews, trust-score recomputation): `web/supabase/migrations/20260813120000_create_reviews.sql:88-106`
- `is_admin()` helper (profiles): `web/supabase/migrations/20260812000000_create_profiles.sql:66`
- Reports RPC + admin gate: `web/supabase/migrations/20260813130000_create_reports.sql:84-161`
- Dashboard badge idiom: `web/app/(site)/dashboard/page.tsx:87-89`
- Server-side unread-count idiom: `web/lib/offers.ts:165-181`
- Authoritative Realtime: https://supabase.com/docs/guides/realtime/postgres-changes
- Authoritative RLS: https://supabase.com/docs/guides/auth/row-level-security
- Authoritative triggers: https://supabase.com/docs/guides/database/postgres/triggers
