# Domain Model

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Draft
>
> **Owner:** CTO / Engineering Team

# 1. Purpose

This document defines the core business domain of the marketplace.

Rather than focusing on database tables, it models the real-world concepts that the platform manages.

The domain model serves as the foundation for:

- Database Design
- API Design
- Business Logic
- Authorization Rules
- AI Features
- Future Scalability

# 2. Domain Overview

The marketplace revolves around one central concept:

> A trusted marketplace where users exchange second-hand goods.

Every other entity exists to support this interaction.

The primary business entities are:

- User
- Seller Profile
- Listing
- Category
- Listing Image
- Offer
- Favorite
- Review
- Report
- Notification
- Verification
- Account Tier
- Listing Boost
- AI Credit

# 3. Core Domain Diagram

```text
                 User
                  │
      ┌───────────┴────────────┐
      │                        │
      ▼                        ▼
 Seller Profile          Buyer Activity
      │                        │
      │        ┌───────────────┴──────────────┐
      │        │              │              │
      ▼        ▼              ▼              ▼
 Listing    Favorite       Offer        Review
      │
      │
      ▼
 Listing Images
      │
      ▼
 Category

Report ─────────────► Listing

Notification ◄────── System

Verification ───────► Seller Profile

Account Tier ───────► Seller Profile

Listing Boost ──────► Listing

AI Credit ──────────► User
```

# 4. Aggregate Roots

Following Domain-Driven Design (DDD), not every entity is independent.

Some entities belong to an aggregate.

## Aggregate: User

**Root Entity:** User

**Children:** Profile, Favorites, Notifications

## Aggregate: Listing

**Root Entity:** Listing

**Children:** Images, Offers, Reports

## Aggregate: Seller

**Root Entity:** Seller Profile

**Children:** Reviews, Verification, Trust Score

# 5. Entity Definitions

# User

## Purpose

Represents every authenticated person.

### Attributes

- User ID
- Email
- Role (buyer / seller / admin)
- Created At
- Last Login

### Roles

- **Buyer** — browses, favorites, offers, reviews.
- **Seller** — a buyer who additionally publishes listings and manages offers.
- **Admin** — moderation-only. Admins may read everything (inspect listings, profiles, and the console) but may not trade: no selling, offering, favoriting, reviewing, contacting sellers, or filing community reports. All non-moderation writes are blocked. See ADR-020.

### Responsibilities

- Authentication
- Ownership
- Authorization

### Relationships

**Owns:** Profile, Listings, Favorites, Offers

# Seller Profile

## Purpose

Represents the public identity of a seller.

### Attributes

- Display Name
- Avatar
- Phone
- Telegram
- City
- Bio
- Trust Score

### Relationships

**Belongs to:** User

**Has many:** Listings, Reviews, Verification Records

# Account Tier

## Purpose

Represents the seller's capacity plan (free / pro / business). Tier is set server-side only — a user can never self-promote (`profiles_guard_tier_change`), so the tier a client reads is always trusted. T24 (map #54, decision #56; monetization strategy §36).

### Attributes

- Tier (free / pro / business)
- Active-listing cap (free 5 / pro 25 / business 100)
- Images-per-listing cap (10 for all tiers)
- Monthly AI-generation cap (free 3 / pro 30 / business uncapped)

### Rules

- The caps are the single source of truth in `web/lib/plans/constants.ts`; server guards and the client UI read the same constants.
- A tier can be assigned by admin only; upgrade intents are recorded, never applied in the MVP (ADR-021).

### Relationships

**Belongs to:** User (1 : 1)

# Listing Boost

## Purpose

Promotes a published listing in search/browse for a fixed window. T29 (monetization strategy §15: 49 ETB / 3 days, 99 ETB / 7 days).

### Attributes

- Listing
- Preset (standard / premium)
- Expiry (`boosted_until`)

### Rules

- The expiry is computed by the `boost_listing` SECURITY DEFINER RPC — the client must never set its own window (ADR-021).
- Only the owning seller of a published listing may boost it.
- Payment is handled off-platform; no in-app billing (ADR-021, ADR-014).

### Relationships

**Belongs to:** Listing (1 : 1 optional)

# AI Credit

## Purpose

A monthly allowance of AI listing generations per seller. T25 (map #54, decision #57).

### Attributes

- User
- Event (generate / regenerate)
- Created At

### Rules

- One credit is consumed only on a successful AI draft (`record_ai_generation` RPC).
- The month window is `date_trunc('month')` server-side, so the cap resets on the 1st with no cron.
- Business tier is uncapped: the RPC records the generation without enforcing a ceiling.

### Relationships

**Belongs to:** User (1 : N)

# Listing

## Purpose

Represents a second-hand product offered for sale.

### Attributes

- Title
- Description
- Price
- Condition
- Status
- Published Date

### Relationships

**Belongs to:** Seller

**Has many:** Images, Offers, Reports

**Belongs to:** Category

# Listing Image

## Purpose

Stores product images.

### Attributes

- URL
- Order
- Alt Text

### Rules

Every listing must contain at least one image.

**Maximum:** 10 images.

# Category

## Purpose

Organizes listings.

### Examples

- Electronics
- Furniture
- Vehicles
- Fashion

### Rules

Each listing belongs to exactly one category.

# Offer

## Purpose

Represents a buyer's price proposal.

### Attributes

- Amount
- Status
- Message
- Created At

### Status

**Pending:** Accepted

**Rejected:** Expired

### Relationships

**Belongs to:** Buyer, Listing

# Favorite

## Purpose

Stores saved listings.

### Relationships

**Belongs to:** User

**References:** Listing

### Rules

Duplicate favorites are not allowed.

# Review

## Purpose

Represents buyer feedback.

### Attributes

- Rating
- Comment
- Date

### Relationships

**Belongs to:** Buyer, Accepted Offer (the completed transaction)

**References:** Seller

### Rules

One review per completed transaction.

Each review must reference an accepted offer.

# Report

## Purpose

Community moderation.

### Reasons

**Spam:** Fraud

**Duplicate:** Wrong Category

**Offensive Content:** Other

### Relationships

**Belongs to:** Listing

**Submitted by:** User

# Notification

## Purpose

Inform users about marketplace events.

### Examples

- Offer received
- Listing sold
- Listing reported

### Status

**Unread:** Read

Archived

# Verification

## Purpose

Represents trust signals.

### Types

**Email:** Phone

**Telegram:** Future Fayda

### Status

**Pending:** Verified

Rejected

# 6. Ownership Rules

| Entity | Owner |
|----------|-------|
| User | System |
| Seller Profile | User |
| Listing | Seller |
| Listing Image | Listing |
| Offer | Buyer |
| Favorite | User |
| Review | Buyer |
| Report | User |
| Notification | System |
| Verification | Seller |
| Account Tier | System (admin-assigned only) |
| Listing Boost | Seller |
| AI Credit | System (ledger) |

# 7. Relationship Cardinality

| Relationship | Cardinality |
|--------------|-------------|
| User → Seller Profile | 1 : 1 |
| User → Listings | 1 : N |
| User → Favorites | 1 : N |
| User → Offers | 1 : N |
| User → Notifications | 1 : N |
| Category → Listings | 1 : N |
| Listing → Images | 1 : N |
| Listing → Offers | 1 : N |
| Listing → Reports | 1 : N |
| Seller → Reviews | 1 : N |
| Seller → Verification Records | 1 : N |
| User → Account Tier | 1 : 1 |
| User → AI Credits | 1 : N |
| Listing → Listing Boost | 1 : 0..1 |

# 8. Business Invariants

These rules must always be true.

## INV-001

Every listing has exactly one owner.

## INV-002

Every listing belongs to one category.

## INV-003

Every published listing has at least one image.

## INV-004

Only the listing owner can edit or archive a listing.

## INV-005

A user cannot submit an offer on their own listing.

## INV-006

A buyer may only favorite a listing once.

## INV-007

Trust Score is derived from platform activity and cannot be manually edited.

## INV-008

A review must reference a completed transaction (an accepted offer).

## INV-009

Verification records are immutable after approval.

## INV-010

A seller's tier is assigned by the system only — a client can never self-promote (tier mutations are blocked at the DB).

## INV-011

A listing boost window is owned by the `boost_listing` RPC — the client never computes its own expiry.

## INV-012

An AI credit is consumed only on a successful AI draft; failed or degraded generations consume nothing.

# 9. Domain Events

The system reacts to significant events.

Examples:

### ListingCreated

- Notify followers (future)
- Update seller statistics
- Index listing

### OfferSubmitted

- Notify seller
- Update dashboard

### OfferAccepted

- Notify buyer
- Allow review after transaction

### ListingMarkedSold

- Prevent new offers
- Update seller metrics

### ReviewSubmitted

- Recalculate Trust Score

### ListingReported

- Add moderation task

### VerificationApproved

- Update verification badge
- Increase Trust Score

# 10. Domain Services

Some logic belongs to services rather than entities.

## Trust Score Service

Calculates seller reputation.

Inputs:

- Ratings
- Reports
- Profile completion
- Verification
- Sales

## AI Listing Service

Generates:

- Titles
- Descriptions
- Categories
- Keywords
- Quality Score

## Search Service

Handles:

- Keyword matching
- Filtering
- Ranking
- Pagination

## Notification Service

Creates platform notifications.

# 11. Value Objects

Value objects have no identity.

Examples:

## Money

- Amount
- Currency (ETB)

## Address

- City
- Sub-city

## Phone Number

Validated Ethiopian phone number.

## Listing Condition

Allowed values:

- Brand New
- Like New
- Lightly Used
- Fair Condition
- For Parts

## Trust Score

Range:

0–100

Read-only.

# 12. Bounded Contexts

To keep the system modular, the domain is divided into contexts.

### Identity Context

- User
- Authentication
- Verification

### Marketplace Context

- Listings
- Categories
- Search
- Favorites

### Transaction Context

- Offers
- Reviews

### Moderation Context

- Reports
- Trust Score

### Monetization Context

- Account Tier
- Listing Boost
- AI Credit

### AI Context

- AI Listing Assistant
- Listing Quality Score

# 13. Domain Summary

| Context | Primary Entity |
|----------|----------------|
| Identity | User |
| Marketplace | Listing |
| Trust | Seller Profile |
| Transactions | Offer |
| Moderation | Report |
| Monetization | Account Tier |
| AI | AI Listing Service |

# 14. Summary

The Domain Model represents the business language of the marketplace.

By clearly defining entities, relationships, ownership, invariants, and domain services, it creates a stable foundation for database design, APIs, and business logic.

This model ensures that future features can be added without compromising the integrity of the core domain.