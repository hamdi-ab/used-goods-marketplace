# Database Design Specification

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Database:** PostgreSQL (Supabase)
>
> **Status:** Draft
>
> **Owner:** Backend Team

# 1. Purpose

This document defines the complete database design for the Used Goods Marketplace.

It includes:

- Entity Relationship Model
- Tables
- Columns
- Constraints
- Indexes
- Relationships
- Row Level Security (RLS)
- Soft Delete Strategy
- Audit Strategy

# 2. Design Principles

The database follows these principles:

- Normalize until practical (3NF)
- Use UUIDs for primary keys
- Enforce integrity with foreign keys
- Use soft deletes for recoverability
- Design for scalability
- Minimize duplicated data
- Keep derived values out of the database where possible

# 3. High-Level ER Diagram

```text
profiles
   │
   ├──────────────┐
   │              │
   ▼              ▼
listings      favorites
   │              │
   │              │
   ▼              │
listing_images    │
   │              │
   ▼              │
categories        │

listings ─────── offers
      │
      ├────────── reports
      │
      └────────── conversations (future-ready)

profiles ─────── reviews

profiles ─────── verifications

profiles ─────── notifications
```

# 4. Naming Conventions

## Tables

**Plural:** Examples

```
profiles
listings
offers
favorites
```

## Primary Keys

```
id UUID PRIMARY KEY
```

## Foreign Keys

```
user_id

listing_id

category_id
```

## Timestamps

```
created_at

updated_at

deleted_at
```

# 5. Common Audit Columns

Every business table includes:

| Column | Type |
|----------|------|
| id | UUID |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| deleted_at | TIMESTAMPTZ NULL |

# 6. Table: profiles

**Purpose:** Stores public user information.

| Column | Type | Notes |
|----------|------|------|
| id | UUID | References auth.users |
| full_name | TEXT | Required |
| avatar_url | TEXT | Nullable |
| phone | TEXT | Nullable |
| telegram_username | TEXT | Nullable |
| city | TEXT | Required |
| sub_city | TEXT | Nullable |
| bio | TEXT | Nullable |
| trust_score | SMALLINT | 0–100; composite recompute `recompute_trust_score()` (fix #83): round(0.35·avg rating×20 + 0.25·profile_completion + 0.20·min(10, sold listings)×10 + 0.10·(phone_verified+fayda_verified)×50 + 0.10·max(0, 100−25·resolved reports)), clamped 0–100; recalculated by `submit_review`, `accept_offer`, `record_verification`, `resolve_report` |
| profile_completion | SMALLINT | 0–100; generated — 20% per populated field (avatar_url, phone, telegram_username, city, bio), recomputed on every write (fix #82) |
| role | TEXT | buyer / seller / admin |

**Indexes:** phone, city

# 7. Table: categories

| Column | Type |
|----------|------|
| id | UUID |
| name | TEXT |
| slug | TEXT |
| parent_id | UUID NULL |
| icon | TEXT NULL |

**Rules:** Slug unique, Parent optional

# 8. Table: listings

| Column | Type |
|----------|------|
| id | UUID |
| seller_id | UUID |
| category_id | UUID |
| title | TEXT |
| description | TEXT |
| price | NUMERIC(12,2) |
| condition | TEXT |
| negotiable | BOOLEAN |
| city | TEXT |
| sub_city | TEXT |
| status | TEXT |
| view_count | INTEGER DEFAULT 0 |
| favorite_count | INTEGER DEFAULT 0 |
| published_at | TIMESTAMPTZ |
| sold_to_buyer_id | UUID NULL | T08: winner of an accepted offer, stamped by `accept_offer` so the sold listing stays readable to the buyer without an offers↔listings RLS cycle |

**Indexes:** seller_id, category_id, city, status, price, published_at

**Future:** Full-text index

# 9. Table: listing_images

| Column | Type |
|----------|------|
| id | UUID |
| listing_id | UUID |
| image_url | TEXT |
| display_order | SMALLINT |
| alt_text | TEXT |

**Rules:** Maximum

10 images

# 10. Table: offers

| Column | Type |
|----------|------|
| id | UUID |
| listing_id | UUID |
| buyer_id | UUID |
| amount | NUMERIC(12,2) |
| message | TEXT |
| status | TEXT |

**Indexes:** buyer_id, listing_id, status

# 11. Table: favorites

Composite Unique

```
(user_id, listing_id)
```

Columns

| Column | Type |
|----------|------|
| id | UUID |
| user_id | UUID |
| listing_id | UUID |

# 12. Table: reviews

| Column | Type |
|----------|------|
| id | UUID |
| offer_id | UUID |
| seller_id | UUID |
| buyer_id | UUID |
| rating | SMALLINT |
| comment | TEXT |

**Constraints:** `offer_id` references `offers.id` (FK): a review must belong to an accepted offer, which is the completed transaction., UNIQUE `(offer_id)` — one review per completed transaction (supports INV-008).

**Rating:** 1–5

# 13. Table: reports

| Column | Type |
|----------|------|
| id | UUID |
| listing_id | UUID |
| reporter_id | UUID |
| reason | TEXT |
| description | TEXT |
| status | TEXT |

**Statuses:** Pending, Reviewing, Resolved, Rejected

# 14. Table: notifications

| Column | Type |
|----------|------|
| id | UUID |
| user_id | UUID |
| type | TEXT |
| title | TEXT |
| body | TEXT |
| is_read | BOOLEAN |
| metadata | JSONB |

# 15. Table: verifications

| Column | Type |
|----------|------|
| id | UUID |
| user_id | UUID |
| type | TEXT |
| status | TEXT |
| verified_at | TIMESTAMPTZ |

**Types:** Email, Phone, Telegram, Fayda

# 16. Table: conversations (Future-Ready)

**Purpose:** Track buyer-seller contact attempts.

| Column | Type |
|----------|------|
| id | UUID |
| listing_id | UUID |
| buyer_id | UUID |
| seller_id | UUID |
| contact_method | TEXT |
| status | TEXT |
| initiated_at | TIMESTAMPTZ |

**Supported methods:** Telegram, Phone

This table enables analytics today and in-app messaging tomorrow.

# 17. Relationships

| Parent | Child | Type |
|----------|-------|------|
| profiles | listings | 1:N |
| categories | listings | 1:N |
| listings | listing_images | 1:N |
| listings | offers | 1:N |
| listings | reports | 1:N |
| profiles | reviews | 1:N |
| profiles | favorites | 1:N |
| offers | reviews | 1:1 |
| profiles | notifications | 1:N |
| profiles | verifications | 1:N |

# 18. Constraints

## Listings

- Price > 0
- Title length: 5–120
- Description length: 20–2000

## Reviews

Rating between 1 and 5.

One review per accepted offer (UNIQUE `offer_id`).

## Favorites

Unique (user_id, listing_id)

## Images

Maximum 10 per listing (enforced in application logic).

# 19. Index Strategy

Indexes on:

- category_id
- seller_id
- city
- status
- price
- published_at
- buyer_id
- phone

Future:

GIN index for PostgreSQL full-text search on listing title and description.

# 20. Row Level Security (RLS)

## Profiles

- Users can read public profiles.
- Users can update only their own profile.

## Listings

- Public can read published listings.
- Sellers can create listings.
- Sellers can update/delete only their own listings.

## Offers

- Buyer can read/write their own offers.
- Seller can read offers on their listings.
- Admin has full access.

## Favorites

- Users can only access their own favorites.

## Reviews

- Public can read.
- Buyer can create one review per completed transaction (one per accepted offer).
- Author can edit within a short grace period (optional).

## Reports

- Reporter can create.
- Admin can read/update.
- Public cannot view reports.

## Notifications

- Users can only read their own notifications.

## Verifications

- Users can view their own verification records.
- Only admins/system services can update verification status.

# 21. Soft Delete Strategy

Instead of deleting rows permanently:

```
deleted_at = CURRENT_TIMESTAMP
```

Benefits:

- Recovery
- Audit history
- Analytics
- Fraud investigation

Queries should exclude deleted rows by default.

# 22. Migration Strategy

Version database changes using timestamped SQL migrations.

Example:

```text
20260806_create_profiles.sql
20260806_create_categories.sql
20260807_create_listings.sql
```

# 23. Seed Data

Initial categories:

- Electronics
- Furniture
- Home Appliances
- Vehicles
- Fashion
- Books
- Sports
- Baby & Kids
- Other

Create one admin account for moderation.

# 24. Future Extensions

The schema is designed to support:

- Payments
- Delivery
- Saved Searches
- AI Price Suggestions
- Business Accounts
- Push Notifications
- In-app Messaging
- Seller Subscriptions

without breaking existing tables.

# 25. Summary

This database design provides a normalized, scalable, and secure foundation for the marketplace.

By combining PostgreSQL features, Supabase Row Level Security, audit fields, and future-ready modeling, it supports both the MVP requirements and long-term platform evolution while remaining simple enough for rapid implementation during the VinTech Challenge.