# Performance & Scalability Strategy

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Draft
>
> **Owner:** Engineering Team

# 1. Purpose

This document defines how the marketplace maintains fast response times, efficient resource usage, and sustainable growth as the number of users and listings increases.

It covers:
- Performance optimization
- Scalability
- Caching
- Database optimization
- Image delivery
- Search performance
- Future scaling strategy

# 2. Performance Goals

The MVP targets the following metrics:
| Metric | Target |
|---------|---------|
| First Contentful Paint | < 1.8 s |
| Largest Contentful Paint | < 2.5 s |
| Time to Interactive | < 3.0 s |
| API Response Time | < 300 ms |
| Search Response | < 500 ms |
| Image Upload | < 5 s |
| Lighthouse Performance | ≥ 95 |

# 3. Scalability Principles

The platform follows these principles:
- Horizontal scalability
- Stateless services
- CDN-first asset delivery
- Efficient database indexing
- Lazy loading
- Incremental optimization

## NFR mapping to how it is met

**NFR-SCALE-001**: 10,000 users, 50,000 listings, and 500 concurrent users are initial **design targets**, required "without architectural changes."

Two distinct numbers, two distinct guarantees:

- **10,000 users / 50,000 listings** is a *scale* (registration and dataset volume), not a load figure. Postgres handles these row counts trivially. Meeting it is a query-shape guarantee: every list is **paginated** (NFR-SCALE-002), every filter/search/order column is **indexed** (NFR-SCALE-003), and search runs through the single `security definer` RPC on a tsvector + GIN (pg_trgm) base. No proof-load is required for this half.
- **500 concurrent users** is a *load* figure — the simultaneous-connection peak that drives server, Postgres, and image delivery. This half is met by architecture, and verified empirically by load test:
  - Stateless Next.js frontend on Vercel auto-scales horizontally; the edge/CDN absorbs asset requests.
  - Supabase Postgres serves indexed, paginated queries; the search path is one RPC round-trip, not N+1.
  - Images serve from object storage behind the CDN (NFR-SCALE-004), off the app server path.
  - API target < 300 ms and search < 500 ms keep connection-hold time short, so fewer long-lived sockets.

Verification: a load test (see T19 — load & capacity verification) records a p95 baseline at a meaningful concurrency (initial target 100–200 concurrent, extrapolating the 500-design shape) and is the evidence cited for this half. Absent that test, the doc-party claim is *target-only* and deliberately stated as such.

# 4. Rendering Strategy

## Server Components

Use for:
- Home page
- Listings
- Categories
- Seller pages

Benefits:
- Better SEO
- Reduced JavaScript
- Faster first load

## Client Components

Only where interaction is required.

Examples:
- Forms
- Favorites
- Filters
- Offer modal

# 5. Image Optimization

Images are the largest assets in the application.

Strategy:
- Store originals in Supabase Storage
- Compress before upload
- Serve responsive sizes
- Lazy load below-the-fold images
- Use WebP where supported

Future:
- Automatic thumbnail generation
- Blur placeholders

# 6. Database Optimization

Use indexes on:
- category_id
- seller_id
- city
- status
- price
- published_at

Avoid N+1 queries.

Select only required columns.

Paginate all large datasets.

# 7. Search Optimization

MVP:
- PostgreSQL full-text search
- Indexed filters
- Server-side pagination

Future:
- Meilisearch
- Elasticsearch
- AI semantic search

# 8. Caching Strategy

## Browser Cache

- Images
- Icons
- Fonts

## CDN Cache

Static assets served through Vercel CDN.

## Server Cache

Cache:
- Categories
- Homepage metadata
- Popular listings

# 9. Pagination

Never load all listings.

Default: 20 items/page.

Support:
- Infinite scroll
- Traditional pagination

# 10. Network Optimization

- HTTP compression
- Minified assets
- Tree shaking
- Code splitting
- Dynamic imports

# 11. Bundle Optimization

Lazy-load:
- Dashboard
- AI assistant
- Admin area
- Analytics

Keep the initial bundle as small as possible.

# 12. Realtime Strategy

Use Supabase Realtime only for:
- Notifications
- Offer updates

Avoid unnecessary live subscriptions.

# 13. AI Performance

AI requests are asynchronous.

Users receive:
- Loading indicator
- Timeout handling
- Retry option

Responses should never block the core marketplace.

# 14. Future Scaling

The architecture supports:
- Read replicas
- Redis caching
- Dedicated search engine
- Object storage CDN
- Queue workers
- Microservices (only when justified)

# 15. Performance Monitoring

Track:
- Page load times
- API latency
- Database query duration
- Image upload duration
- AI response time

Tools (future):
- PostHog
- Sentry
- Vercel Analytics

# 16. Performance Budget

Initial JavaScript: < 250 KB (compressed)

Initial images: Optimized and lazy-loaded.

Avoid unnecessary third-party libraries.

# 17. Summary

The marketplace is designed to deliver a fast and responsive experience from the MVP while providing a clear path for future growth.

By combining server-first rendering, optimized database queries, efficient image delivery, caching, and scalable infrastructure, the platform remains practical for the VinTech Challenge and ready for production evolution.
