# Load & Capacity Verification (T19)

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Owner:** Engineering Team
>
> **Status:** Pending hosting — scenario ready, live run blocked on T17 deploy

> **Scope note:** This report is the deliverable of tracker ticket T19 — Load & capacity verification (GitHub issue #23 on `hamdi-ab/used-goods-marketplace`). It proves the NFR-SCALE-001 **concurrency** half (500 concurrent) empirically. The scale half (10,000 users / 50,000 listings) is a query-shape guarantee (pagination + indexing) and is out of scope here. Live numbers require a hosted endpoint; see **Status**.

# 1. Run status

| Item | Value |
|---|---|
| Script | `load-test/load-test.js` (k6, ramping-vus) |
| Validated against | k6 v2.2.0, local mock server (syntax + execution, exit 0, thresholds green) |
| Hosted target | **None yet** — T01 (scaffold) open, T17 (deploy) not started; no preview/staging URL exists |
| Live measurement | **Pending hosting** — re-run with `BASE_URL=<hosted-url>` once deployed |

Per the T19 brief: the app is not yet hosted, so this ticket delivers the scenario, the methodology, and the report template with the run marked *pending-hosting* rather than blocking. The runbook in `load-test/README.md` is the step-by-step; this doc is where the measured numbers land.

# 2. Tested endpoints

| Endpoint | Request | Expected p95 | Measured p95 |
|---|---|---|---|
| Home | `GET /` (SSR page) | < 300 ms | _pending hosting_ |
| Browse | `GET /api/v1/listings?page=1&limit=20` | < 300 ms | _pending hosting_ |
| Search | `GET /api/v1/search?query=…` | < 500 ms | _pending hosting_ |
| Listing detail | `GET /api/v1/listings/{id}` (id chained from browse) | < 300 ms | _pending hosting_ |

# 3. Concurrency

Profile: `ramping-vus`, 0 → 100 VUs (30 s), hold 100 (60 s), ramp 100 → 200 VUs (30 s), hold 200 (60 s), cool-down. The ticket's initial target is **100–200 concurrent VUs**; the 500-concurrent extrapolation run (0 → 300 → 500) is a documented second step in `load-test/README.md`. Thresholds: API p95 < 300 ms, search p95 < 500 ms, error rate < 1%, checks > 99%.

# 4. Results

| Metric | Value |
|---|---|
| Run date | _pending hosting_ |
| Hosted URL | _pending hosting_ |
| Peak concurrent VUs | _pending hosting_ |
| Throughput | _pending hosting_ |
| Home p95 | _pending hosting_ |
| Browse p95 | _pending hosting_ |
| Search p95 | _pending hosting_ |
| Listing detail p95 | _pending hosting_ |
| Error rate | _pending hosting_ |
| Threshold result | _pending hosting_ |

# 5. Bottleneck

Not yet measurable. When run, identify the **first** degradation in this order (from `load-test/README.md`):

1. **Frontend instances** — all-endpoint p95 rises together, Vercel function saturation.
2. **Postgres CPU** — DB-backed endpoints degrade while home stays flat.
3. **Connection pool** — connection timeouts/exhaustion with low CPU.
4. **Image CDN** — CDN latency/failures while API stays green.

Record the observed first bottleneck, the concurrency it appeared at, and the evidence (dashboard metric / error class).

# 6. Verdict

**500 concurrent is expected to be realistic without architectural change** — the design (stateless Next.js on Vercel horizontal auto-scale, indexed + paginated Supabase Postgres, single-RPC search, CDN-served images) is built for it — but this is an **architectural assessment, not a measured claim**. The measured p95s above must land before the NFR-SCALE-001 concurrency half is considered verified. Once the hosted endpoint exists (T17), run `load-test/load-test.js` and backfill §2–§5; update the NFR mapping in [00-performance-and-scalability-strategy.md](00-performance-and-scalability-strategy.md) with the measured values.

# 7. Related documents

- [00-performance-and-scalability-strategy.md](00-performance-and-scalability-strategy.md) — NFR-SCALE-001 mapping (this report is its cited evidence)
- [04-api-specification.md](../02-architecture/04-api-specification.md) — endpoint contracts the scenario targets
- [10-submission-readiness.md](10-submission-readiness.md) — hosting plan (T17) that unblocks the live run
