# Load Test — Methodology & Runbook

k6 scenario proving the NFR-SCALE-001 concurrency half (500 concurrent) for the Used Goods Marketplace. The report is `docs/03-engineering/11-load-verification.md`.

## What it measures

Four public, unauthenticated endpoints that carry the concurrent-user load:

| Endpoint | Request | Target p95 |
|---|---|---|
| Home | `GET /` (SSR page) | < 300 ms |
| Browse | `GET /api/v1/listings?page=1&limit=20` | < 300 ms |
| Search | `GET /api/v1/search?query=…` | < 500 ms |
| Listing detail | `GET /api/v1/listings/{id}` | < 300 ms |

The listing `{id}` is chained from the browse response (`data[0].id`), so the scenario exercises a realistic read-after-browse path and hits a real row, not a synthetic one. Override with `LISTING_ID` when the browse payload shape differs.

## Load profile

`ramping-vus` executor (virtual-user concurrency, per the ticket):

| Stage | Duration | Target |
|---|---|---|
| Warm-up ramp | 30 s | 0 → 100 VUs |
| Hold @ 100 | 60 s | 100 VUs |
| Ramp | 30 s | 100 → 200 VUs |
| Hold @ 200 | 60 s | 200 VUs |
| Cool-down | 10 s | 200 → 0 VUs |

Think time of 1–3 s between requests models human pacing. Full run ≈ 3 minutes.

## Running

k6 is required on the runner (k6 ≥ 0.50; the script was validated against k6 v2.2.0). Install via the [official release binary](https://github.com/grafana/k6/releases), or run with Docker where a working daemon exists:

```
docker run --rm -v "$PWD":/app -i grafana/k6 run --env BASE_URL=<hosted-url> /app/load-test/load-test.js
```

Local run against a working daemon (dev app on localhost:3000):

```
k6 run --env BASE_URL=http://localhost:3000 load-test/load-test.js
```

Hosted run — replace with the live URL (default Vercel deployment, see `docs/03-engineering/10-submission-readiness.md`):

```
k6 run --env BASE_URL=https://used-goods-marketplace.vercel.app load-test/load-test.js
```

### Environment variables

| Var | Default | Meaning |
|---|---|---|
| `BASE_URL` | `http://localhost:3000` | Target origin; required for a hosted run |
| `START_VUS` | `100` | Initial concurrency (ticket: 100–200) |
| `END_VUS` | `200` | Peak concurrency |
| `RAMP_SEC` | `30` | Ramp duration between plateaus |
| `HOLD_SEC` | `60` | Plateau hold duration |
| `SEARCH_QUERY` | `phone` | Search term for the search request |
| `LISTING_ID` | *(browse-chained)* | Pin a specific listing id |
| `LIMIT` | `20` | Browse page size |

### Output

- `--summary-export summary.json` gives machine-readable p95 per endpoint (`http_req_duration{name:…}`) and threshold pass/fail. Use this to fill the report table.
- Thresholds enforce the NFR at run time: API p95 < 300 ms, search p95 < 500 ms, error rate < 1%, checks > 99%. A non-zero exit code means an NFR was missed.

## Identifying the first bottleneck

Ramp concurrency in stages (100 → 200 → 500 for the extrapolation run). Whichever metric degrades first, in this order, names the bottleneck:

1. **Frontend instances** — p95 rises across *all* endpoints together and Vercel shows function saturation/evictions. Fix: horizontal scale / regions; verify with Vercel dashboard.
2. **Postgres CPU** — p95 rises on browse/search/detail (the DB-backed paths) while home (cached/edge) stays flat; Supabase dashboard shows DB CPU pegging. Fix: read replica, query tuning, cache hot queries.
3. **Connection pool** — errors jump on DB-backed endpoints (connection timeouts, pool exhaustion) while CPU stays low. Fix: pool sizing (Supabase) or PgBouncer.
4. **Image CDN** — image/CDN requests start failing or latency climbs while API stays green; CDN cache hit ratio drops. Fix: cache rules, prewarm, next/image config.

Record in the report which one appeared first and at what concurrency.

## Validation note

This scenario was executed successfully against a local mock server (all endpoints returning 200, all thresholds green, exit 0) to prove the script compiles and the per-endpoint tags, chained listing id, and thresholds all work. That mock run produced **no** meaningful latency numbers and is **not** the T19 measurement. The real run is pending a hosted endpoint (T01 scaffold / T17 deploy) — see `docs/03-engineering/11-load-verification.md`.

---

## Related

- **Web app:** [`../../web/README.md`](../../web/README.md) — full setup, architecture, demo accounts
- **Repo root:** [`../../README.md`](../../README.md) — overview, doc map, all doc families
- **Load verification report:** [`docs/03-engineering/11-load-verification.md`](../docs/03-engineering/11-load-verification.md)
- **PRD:** [`docs/01-prd/00-overview.md`](../docs/01-prd/00-overview.md)
- **Architecture:** [`docs/02-architecture/00-system-architecture.md`](../docs/02-architecture/00-system-architecture.md)
