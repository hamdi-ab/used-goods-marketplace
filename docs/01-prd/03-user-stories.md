# Product Requirements Document (PRD)
# 03 - User Stories

> **Version:** 1.0
> **Status:** Draft
> **Owner:** Product Team
> **Related Documents:**
> - 02-user-personas.md
> - 04-functional-requirements.md

# 1. Introduction

This document defines the functional behavior of the marketplace from the perspective of its users.

Each story represents a user goal and includes business value, priority, acceptance criteria, and implementation notes.

User stories are grouped by feature area to support sprint planning and engineering execution.

# Story Format

Every story follows this structure.

**As a** <User>

**I want to** <Goal>

**So that** <Benefit>

Each story also contains:

- Priority
- Business Value
- Acceptance Criteria
- Technical Notes
- Dependencies

# Epic 1 — Authentication

## US-001 — Create an Account

**As a:** New User

**I want to:** Create an account

**So that:** I can buy and sell items.

**Priority:** Must Have

**Business Value:** High

**Acceptance Criteria:**
- User can register using email and password.
- Email validation is enforced.
- Duplicate accounts are prevented.
- User profile is created automatically.
- User is redirected to onboarding after registration.

**Technical Notes:**
- Use Supabase Authentication.
- Store profile separately from authentication.

**Dependencies:** Supabase Auth

## US-002 — Login

**As a:** Registered User

**I want to:** Log into my account

**So that:** I can access my listings and profile.

**Priority:** Must Have

**Acceptance Criteria:**
- Valid credentials authenticate successfully.
- Invalid credentials display clear error messages.
- Session persists after refresh.
- Secure logout is available.

## US-003 — Edit Profile

**As a:** Registered User

**I want to:** Update my profile

**So that:** Buyers can trust me.

**Priority:** Must Have

**Acceptance Criteria:**
- Edit name.
- Edit phone number.
- Edit Telegram username.
- Upload profile image.
- Update city and sub-city.

# Epic 2 — Listings

## US-004 — Create Listing

**As a:** Seller

**I want to:** Create a listing

**So that:** Buyers can discover my product.

**Priority:** Must Have

**Acceptance Criteria:**
- Upload multiple images.
- Enter title.
- Enter description.
- Select category.
- Select condition.
- Set price.
- Set negotiable option.
- Choose location.
- Publish successfully.

## US-005 — AI Listing Assistant

**As a:** Seller

**I want to:** Receive AI assistance

**So that:** I can create better listings faster.

**Priority:** Must Have

**Business Value:** Very High

**Acceptance Criteria:**
- AI suggests title.
- AI generates description.
- AI recommends category.
- AI suggests condition.
- AI generates keywords.
- AI calculates listing quality score.

**Technical Notes:**
- AI suggestions remain editable.
- AI never publishes automatically.

## US-006 — Edit Listing

**As a:** Seller

**I want to:** Edit my listing

**So that:** I can keep it accurate.

**Priority:** Must Have

**Acceptance Criteria:**
- Update text.
- Add images.
- Remove images.
- Change price.
- Update condition.
- Save changes.

## US-007 — Mark Listing Sold

**As a:** Seller

**I want to:** Mark my listing as sold

**So that:** Buyers know it is unavailable.

**Priority:** Must Have

**Acceptance Criteria:**
- Listing status changes to Sold.
- Listing remains visible.
- Buyers cannot submit new offers.

# Epic 3 — Search & Discovery

## US-008 — Search Listings

**As a:** Buyer

**I want to:** Search listings

**So that:** I can quickly find products.

**Priority:** Must Have

**Acceptance Criteria:**
- Search title.
- Search description.
- Search category.
- Search location.
- Fast response.

## US-009 — Apply Filters

**As a:** Buyer

**I want to:** Filter search results

**So that:** Only relevant listings appear.

**Priority:** Must Have

**Filters:**
- Category
- Price
- Condition
- City
- Verified Sellers
- Negotiable
- Newest

## US-010 — View Similar Listings

**As a:** Buyer

**I want to:** See similar products

**So that:** I can compare options.

**Priority:** Should Have

**Acceptance Criteria:**
- Show related items.
- Same category.
- Similar price range.

# Epic 4 — Trust

## US-011 — View Seller Trust Score

**As a:** Buyer

**I want to:** View seller trust information

**So that:** I can make informed decisions.

**Priority:** Must Have

**Acceptance Criteria:**
Display:

- Trust Score
- Ratings
- Verification Status
- Sales Count
- Profile Completion

## US-012 — Report Listing

**As a:** Buyer

**I want to:** Report suspicious listings

**So that:** Marketplace quality improves.

**Priority:** Must Have

**Acceptance Criteria:**
- Select reason.
- Optional description.
- Report submitted.
- Duplicate reports prevented.

## US-013 — Leave Review

**As a:** Buyer

**I want to:** Rate the seller

**So that:** Future buyers benefit.

**Priority:** Must Have

**Acceptance Criteria:**
- Rating (1–5)
- Optional comment
- One review per completed transaction

# Epic 5 — Favorites & Offers

## US-014 — Save Favorite

**As a:** Buyer

**I want to:** Save listings

**So that:** I can revisit them later.

**Priority:** Must Have

## US-015 — Submit Offer

**As a:** Buyer

**I want to:** Send an offer

**So that:** I can negotiate.

**Priority:** Must Have

**Acceptance Criteria:**
- Offer amount.
- Optional message.
- Seller notified.
- Offer status tracked.

## US-016 — Accept or Reject Offer

**As a:** Seller

**I want to:** Manage offers

**So that:** I can negotiate efficiently.

**Priority:** Must Have

**Acceptance Criteria:**
- Accept
- Reject
- View history

# Epic 6 — Communication

## US-017 — Contact Seller

**As a:** Buyer

**I want to:** Contact the seller

**So that:** I can arrange the purchase.

**Priority:** Must Have

**Acceptance Criteria:**
- Telegram button.
- Phone call button.
- Copy phone number.

# Epic 7 — Dashboard

## US-018 — Seller Dashboard

**As a:** Seller

**I want to:** View my dashboard

**So that:** I can monitor activity.

**Priority:** Must Have

**Dashboard Includes:**
- Active Listings
- Sold Listings
- Favorites Count
- Offers
- Views
- Trust Score

## US-019 — Listing Analytics

**As a:** Seller

**I want to:** View listing performance

**So that:** I understand buyer interest.

**Priority:** Should Have

**Metrics:**
- Views
- Favorites
- Offers
- Published Date

# Epic 8 — Administration

## US-020 — Moderate Reports

**As an:** Administrator

**I want to:** Review reported listings

**So that:** Marketplace quality remains high.

**Priority:** Must Have

**Acceptance Criteria:**
- View reports.
- Remove listings.
- Suspend users.
- Resolve reports.

# Story Prioritization Summary

| Priority | Description |
|-----------|-------------|
| Must Have | Required for MVP |
| Should Have | Implement if time permits |
| Could Have | Nice-to-have improvements |
| Won't Have | Future releases |

# MVP Story Count

| Epic | Stories |
|------|---------:|
| Authentication | 3 |
| Listings | 4 |
| Search | 3 |
| Trust | 3 |
| Favorites & Offers | 3 |
| Communication | 1 |
| Dashboard | 2 |
| Administration | 1 |

**Total User Stories:** 20

# Story Success Criteria

The MVP is complete when:

- All **Must Have** stories are implemented.
- Acceptance criteria for every Must Have story pass testing.
- End-to-end buyer and seller journeys work without blockers.
- The application is stable, responsive, and ready for demonstration.
