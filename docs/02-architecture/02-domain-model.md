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
| AI | AI Listing Service |

# 14. Summary

The Domain Model represents the business language of the marketplace.

By clearly defining entities, relationships, ownership, invariants, and domain services, it creates a stable foundation for database design, APIs, and business logic.

This model ensures that future features can be added without compromising the integrity of the core domain.