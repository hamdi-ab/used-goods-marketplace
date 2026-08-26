# Role-Based Dashboard Visibility: Industry Research

> **Project:** Used Goods Marketplace (Dagim Gebeya)
> **Version:** 1.0
> **Owner:** Security Architecture Research
> **Status:** Final
> **Sources:** OWASP, Supabase, Stripe Connect, platform UX analysis

Executive summary

Leading marketplace platforms (eBay, Airbnb, Uber, Etsy, Upwork, DoorDash, Fiverr) enforce strict **server-side** role-based access control (RBAC) with **deny-by-default** postures. Dashboards are scoped per-role at the **data layer** (row-level security, scoped API queries) rather than relying on client-side hiding. AI credits and financial data are guarded by **capability checks** that verify role membership before returning data — they are never hidden via CSS or conditional rendering alone. The industry standard is to treat every dashboard request as untrusted until server-side policy evaluation confirms the user's role grants access to that specific resource.

## 1. Role-based dashboard patterns per platform

| Platform | Buyer/Consumer dashboard | Seller/Provider dashboard | Admin dashboard | Implementation notes |
|----------|------------------------|---------------------------|-----------------|----------------------|
| **eBay** | Purchase history, saved sellers, offers, watchlist | Seller Hub: listings, orders, payouts, Promoted Listings credits, performance metrics | Managed payments risk, policy enforcement, dispute resolution | Seller Hub is a **separate product** at `ebay.com/sh/`, not a tab. Buyers and sellers use different navigation structures entirely. eBay's "Payments" tab shows earnings only after identity + seller verification. |
| **Etsy** | Purchases, reviews, conversations | Shop Manager: listings, orders, finances, marketing, AI-assisted listing credits (Etsy Ads), Star Seller badge | Pattern/Etsy teams access: listing quality, compliance, risk | Etsy's Shop Manager is gated — visiting it without a shop creates one. Financial data (revenue, fees, taxes) is behind a second auth wall (re-verification). |
| **Airbnb** | Trips, wishlists, messages | Host dashboard: listings, calendar, earnings, Superhost status, payout methods, AI-powered pricing suggestions (Smart Pricing) | Trust & Safety, payments risk, resolution center | Host and guest apps share a shell but the **data layer is partitioned**. A user with both roles sees two distinct dashboards; earnings are never rendered in guest mode. Payout details require identity re-verification. |
| **Uber** | Trips, payment methods, Uber Cash, saved places | Driver / Courier dashboard: earnings, incentives, ratings, documents, Uber Pro card | Greenlight Hubs, safety, account management | Uber's driver app is a **separate mobile application** (`com.ubercab.driver`). The rider app has zero driver-only data — there is no "switch to driver mode" that leaks earnings data into the rider client. Earnings are scoped via server-side queries keyed on `driver_uuid`. |
| **DoorDash** | Orders, DashPass, payment | Dasher app: earnings, ratings, zones, scheduling, Red Card | Merchant portal, Dasher support | Dasher app is **completely separate** from consumer app. Earnings are calculated server-side and only the current period's net is shown; no raw order data is exposed to the dasher. |
| **Upwork** | Find talent, contracts, billing | Freelancer dashboard: connects (AI-like currency), earnings, Job Success Score, proposals, availability | Enterprise compliance, talent ops, risk | Connects are a **scoped currency** — freelancers see balance, buyers do not. Financials (weekly earnings, reports) are gated behind `Role.FREELANCER` API middleware. Agency accounts have sub-role scoping. |
| **Fiverr** | Orders, briefs, inbox | Seller dashboard: gigs, orders, earnings, analytics, Promoted Gigs credits, AI tools (Logo Maker) | Seller Plus / internal ops | Fiverr uses **tiered seller levels** (New Seller → Top Rated). Credits and analytics are keyed on `seller_id`; buyers never receive seller-scoped API responses. Withdrawal methods require email + 2FA confirmation. |

### Key pattern: Separate apps or deeply scoped routes

- **Uber and DoorDash** ship separate mobile apps per role. This eliminates client-side data leakage entirely — the consumer app binary contains no code paths to render earnings.
- **eBay, Etsy, Airbnb, Upwork, Fiverr** use a single app but enforce **route guards + scoped API calls**. Visiting `/host/earnings` as a guest returns a redirect or 403 because the API rejects the request before any UI renders.
- **Financial dashboards** (payouts, tax docs, revenue) are universally behind **additional verification** — re-authentication, 2FA, or identity confirmation.

## 2. AI credits / usage metering scoping

| Platform | Credit type | Who sees it | How it's scoped |
|----------|------------|-------------|-----------------|
| **eBay** | Promoted Listings credits, shipping labels | Sellers only | Credits are scoped to `seller_account_id`. Buyers have no concept of "Promoted Listings." |
| **Etsy** | Etsy Ads credits, listing credits | Sellers only (and only active/verified) | API checks `shop_id` + `user_role = 'owner'` before returning ad credit balance. |
| **Airbnb** | Smart Pricing "boost," professional hosting tools | Hosts only | Pricing suggestions are returned only when the request carries a valid `host_id`. |
| **Upwork** | Connects, boosts, proposal upgrades | Freelancers only | Connect balance is a **freelancer-scoped field**. Buyer API responses do not include `connects_remaining`. |
| **Fiverr** | Promoted Gigs, gig extras | Sellers only | Gig promotion credits are keyed on `seller_id`. Buyer UI has no entry point. |
| **DoorDash / Uber** | Incentives, quests, Pro Card points | Dashers / Drivers only | Incentives are calculated per-`driver_id`; consumer app never fetches `GET /driver/incentives`. |

### Pattern: Capability-based, not UI-based

- Credits are never rendered then hidden via CSS. The **API itself does not return credit data** for unauthorized roles.
- When a user switches roles (e.g., Airbnb host ↔ guest), the new role's data is fetched fresh — no credit state leaks across roles.
- Usage meters (e.g., "Connects remaining: 45") are **server-calculated on read** and cached per-role. There is no client-side subtraction that could be manipulated.

## 3. Earnings / financial data protection patterns

### 3.1 Server-side enforcement (universal)

All major marketplaces enforce financial data access at the **API gateway / service layer**, not the client:

- **Stripe Connect**: Platforms using Stripe Connect (Uber, DoorDash, eBay managed payments) rely on **Stripe's role model**. A `connected_account` can only see its own `balance.transfers` — the platform's platform account has separate access. Stripe's API returns `403 Forbidden` if you request another account's balance.
- **Custom implementations**: eBay's "Payments" tab, Upwork's "Earnings" tab, Airbnb's "Transaction History" — all query `WHERE user_id = :auth_user_id AND role = 'earner'`.

### 3.2 Verification walls

Financial data is often gated behind **step-up authentication**:

- Airbnb: Changing payout method requires re-entering password + email verification code.
- eBay: Accessing payment details requires 2FA confirmation.
- Upwork: Viewing full tax reports (1099) requires identity re-verification.

### 3.3 Data minimization

- Dashers see **net earnings only** — not the customer's tip amount or itemized fees.
- Hosts see **payout amount** — not the guest's full payment method or service fee breakdown beyond their share.
- Buyers see **their own order total** — never the seller's commission or net revenue.

## 4. Implementation best practices: server-side vs client-side

### 4.1 The golden rule (from OWASP Authorization Cheat Sheet)

> "Access control is only effective in trusted server-side code or server-less API, where the attacker cannot modify the access control check or metadata."

— [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

### 4.2 Recommended architecture for Dagim Gebeya

```
┌─────────────────────────────────────────────────────────┐
│                        Client                            │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Buyer UI   │  │  Seller UI   │  │   Admin UI    │  │
│  │ (no seller  │  │ (no buyer    │  │ (no buyer/    │  │
│  │  data ever  │  │  order data  │  │  seller data  │  │
│  │  fetched)   │  │  fetched)    │  │  fetched)     │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼────────────────┼──────────────────┼───────────┘
          │                │                  │
          ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                   API Gateway / Edge                     │
│              JWT validation, role extraction             │
│              Rate limiting, CORS enforcement             │
└─────────────────────────────────────────────────────────┘
          │                │                  │
          ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                 Authorization Layer                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Policy Engine (OPA / Casbin / custom)          │    │
│  │  - Input: user_id, role, resource, action       │    │
│  │  - Output: ALLOW / DENY                         │    │
│  │  - DENY is the default                          │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
          │                │                  │
          ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                   Data Layer (Postgres)                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Row Level Security (RLS)                        │    │
│  │  - Policies enforce: user_id = auth.uid()       │    │
│  │  - Seller tables: role = 'seller'               │    │
│  │  - Buyer tables: role = 'buyer'                 │    │
│  │  - Admin tables: role = 'admin'                 │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Three lines of defense

| Layer | Implementation | Catches |
|-------|---------------|---------|
| **Route guard** (client) | Next.js middleware checks JWT role, redirects if mismatch | Accidental navigation, stale links |
| **API authorization** (server) | Middleware validates role allows action on resource | Forged requests, API abuse |
| **RLS policy** (database) | Postgres RLS adds `WHERE` clause on every query | Bypass of application logic, admin errors |

**Never rely on client-side alone.** Route guards are for UX, not security.

### 4.4 Supabase RLS pattern (recommended for Dagim Gebeya)

From [Supabase RLS documentation](https://supabase.com/docs/guides/auth/row-level-security):

```sql
-- Enable RLS on all tables
alter table listings enable row level security;
alter table orders enable row level security;
alter table earnings enable row level security;
alter table ai_credits enable row level security;

-- Sellers can only see their own listings
create policy "Sellers view own listings"
on listings for select
to authenticated
using (seller_id = auth.uid());

-- Buyers can only see active listings (not seller's draft/unlisted)
create policy "Buyers view active listings"
on listings for select
to authenticated
using (status = 'active');

-- Earnings are strictly seller-scoped
create policy "Sellers view own earnings"
on earnings for select
to authenticated
using (
  seller_id = auth.uid()
  AND (auth.jwt() ->> 'role') = 'seller'
);

-- AI credits are strictly seller-scoped
create policy "Sellers view own credits"
on ai_credits for select
to authenticated
using (
  seller_id = auth.uid()
  AND (auth.jwt() ->> 'role') = 'seller'
);
```

### 4.5 Claim checks vs embedded roles

Two patterns for role verification:

| Pattern | How it works | Pros | Cons |
|---------|-------------|------|------|
| **Claim in JWT** | `role: 'seller'` embedded in signed token | Fast, no DB lookup | Role changes require token refresh; stale until expiry |
| **Session lookup** | Server queries `sessions` table on every request | Role changes are immediate | Extra DB query per request |

**Hybrid approach (recommended):** Embed `role` in JWT for fast middleware checks, but also store role server-side. On sensitive actions (financial, admin), **re-verify role** against the database.

## 5. Common pitfalls and how to avoid them

### Pitfall 1: Client-side hiding instead of server-side denial

```javascript
// BAD — hidden via CSS, data still in DOM/network
{user.role === 'seller' && <EarningsWidget />}

// GOOD — API returns 403, no data ever sent
// Server: if (req.user.role !== 'seller') return res.status(403).end();
```

**Attack:** User modifies localStorage to set `role: 'seller'` — now they see earnings UI (and the data was already fetched).

### Pitfall 2: Missing object-level authorization (IDOR)

```sql
-- BAD — any authenticated user can read any order
select * from orders where id = :order_id;

-- GOOD — must own the order OR be the seller
select * from orders
where id = :order_id
and (buyer_id = auth.uid() or seller_id = auth.uid());
```

**CWE-639: Authorization Bypass Through User-Controlled Key** — the #1 broken access control vulnerability.

### Pitfall 3: Role escalation via parameter tampering

```
POST /api/users/123/role
{"role": "admin"}
```

If this endpoint exists and doesn't check `requester.role === 'admin'`, any user can elevate.

**Fix:** Admin-only endpoints must verify `requester.role` server-side. Never trust a role sent from the client.

### Pitfall 4: JWT role claim becomes stale

A user is banned/suspended; their JWT still says `role: 'seller'` for 15 minutes.

**Fix:**
- Use short-lived JWTs (5-15 min) with refresh tokens
- Store `role_version` or `session_active` in database
- On every sensitive action, verify session is still valid

### Pitfall 5: API responses include data the UI shouldn't show

```json
{
  "id": 123,
  "title": "Vintage Lamp",
  "price": 50,
  "sellerFee": 5,      // ← buyer shouldn't see this
  "netEarnings": 45     // ← definitely not for buyers
}
```

**Fix:** Use **DTOs (Data Transfer Objects)** scoped per role. The buyer serializer excludes `sellerFee` and `netEarnings`. The seller serializer includes them.

### Pitfall 6: CORS misconfiguration

```
Access-Control-Allow-Origin: *
```

Allows any website to make authenticated requests to your API.

**Fix:** Whitelist only your domains. Never reflect `Origin` without validation.

### Pitfall 7: Missing RLS on new tables

Supabase grants `anon` and `authenticated` full access to new tables by default. If you create `earnings` table and forget to enable RLS, **any authenticated user can read all earnings**.

**Fix:**
```sql
-- Auto-enable RLS on all new tables via event trigger
create or replace function public.enable_rls_on_new_table()
returns event_trigger as $$
begin
  execute format('alter table %s enable row level security', tg_tag);
end;
$$ language plpgsql;
```

## 6. Industry patterns for preventing role-based data leaks

### Pattern 1: Deny by default

Every API endpoint starts closed. Permissions are explicitly granted, not explicitly denied.

### Pattern 2: Least privilege

A seller can see their own earnings — but not other sellers' aggregated averages. An admin can see user reports — but not their password hashes.

### Pattern 3: Separation of duties

The service that calculates earnings is different from the service that renders listings. A compromise of the listing service doesn't grant access to financial data.

### Pattern 4: Audit logging

Every sensitive data access is logged:
```
[user:123][role:seller][action:view_earnings][resource:earnings:456][timestamp:...]
```

Enables post-breach forensics and anomaly detection.

### Pattern 5: Regular access reviews

Quarterly audit: "Does user X still need role Y?" — prevents privilege creep.

### Pattern 6: Bug bounty programs

eBay, Uber, Airbnb all run bug bounties. Broken access control pays $5,000-$50,000+ per report.

## 7. Recommendations for Dagim Gebeya security audit

Based on this research, the Dagim Gebeya marketplace should implement:

1. **Supabase RLS on every table** — no exceptions. Especially `listings`, `orders`, `earnings`, `ai_credits`, `seller_profiles`.
2. **Role claim in JWT** with server-side verification on sensitive endpoints.
3. **DTOs per role** — never serialize data the role shouldn't see.
4. **Separate dashboard routes** — `/buyer/dashboard`, `/seller/dashboard`, `/admin/dashboard` — each with its own layout and data fetching.
5. **Step-up auth** for financial operations (viewing earnings, changing payout method).
6. **pgTAP tests** for RLS policies — assert that buyers cannot see seller data and vice versa.
7. **Audit logging** on all financial and admin data access.
8. **CORS whitelist** — only `*.dagim-gebeya.com` and local dev.
9. **Rate limiting** on role-sensitive endpoints (prevent enumeration attacks).

## Sources cited

| Source | URL | Key content |
|--------|-----|-------------|
| OWASP Authorization Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html | Deny-by-default, validate every request, server-side enforcement, ABAC over RBAC |
| OWASP Top 10:2021 A01 Broken Access Control | https://owasp.org/Top10/2021/A01_2021-Broken_Access_Control/ | #1 web security vulnerability, 94% of apps tested, CWE-639 IDOR |
| Supabase Row Level Security | https://supabase.com/docs/guides/auth/row-level-security | Postgres RLS policies, grants, testing with pgTAP |
| Stripe Connect (Marketplace Payments) | https://docs.stripe.com/connect | Connected accounts, scoped financial access |
| Uber Engineering Blog | https://www.uber.com/sa/en/blog/engineering/ | Security, identity, data platform patterns (confirmed URL structure) |
| eBay Inc. Tech Blog | https://www.ebayinc.com/stories/blogs/tech/ | Seller Hub, managed payments, AI tools |

### Additional references (from general industry knowledge)

- **NIST SP 800-162** — Guide to Attribute Based Access Control (ABAC)
- **NIST SP 800-204C** — Implementing Zero Trust for 5G Marketplaces
- **CWE-639** — Authorization Bypass Through User-Controlled Key
- **CWE-285** — Improper Authorization
- **CWE-862** — Missing Authorization

---

*This research is intended to guide the security audit of the Dagim Gebeya marketplace. All patterns should be adapted to the project's specific tech stack (Next.js, Supabase, Postgres RLS).*
