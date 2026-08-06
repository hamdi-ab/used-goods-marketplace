# Product Requirements Document (PRD)
# 07 - User Flows

> **Version:** 1.0
> **Status:** Draft
> **Priority:** Critical
> **Owner:** Product & UX Team

---

# 1. Introduction

This document defines the end-to-end journeys users take while interacting with the marketplace.

Each flow describes:

- Entry point
- User actions
- System responses
- Decision points
- Success outcomes
- Error scenarios

These flows guide UX design, frontend implementation, backend APIs, and testing.

---

# 2. User Flow Overview

The marketplace supports six primary user journeys:

1. User Registration
2. Buyer Product Discovery
3. Seller Listing Creation
4. Buyer Purchase Journey
5. Offer & Negotiation
6. Trust & Reporting

---

# Flow 1 — User Registration

## Goal

Allow a new user to create an account and complete onboarding.

### Entry Points

- Homepage
- Login Page
- "Sell an Item" CTA

### Flow

```text
Landing Page
      │
      ▼
Click "Sign Up"
      │
      ▼
Registration Form
      │
      ▼
Validate Input
      │
      ▼
Create Account
      │
      ▼
Create User Profile
      │
      ▼
Welcome / Onboarding
      │
      ▼
Marketplace Home
```

### Success Criteria

- Account created successfully
- User session established
- Empty profile initialized

### Error Cases

- Email already exists
- Weak password
- Network failure

---

# Flow 2 — Seller Creates a Listing

## Goal

Allow a seller to publish a product in less than 60 seconds.

### Entry Point

Seller Dashboard

### Flow

```text
Dashboard
    │
    ▼
Create Listing
    │
    ▼
Upload Photos
    │
    ▼
AI Generates Suggestions
    │
    ▼
Review & Edit
    │
    ▼
Publish Listing
    │
    ▼
Listing Live
```

### AI Assistance

The AI may suggest:

- Title
- Description
- Category
- Keywords
- Condition
- Listing Quality Score

Users can:

- Accept
- Edit
- Regenerate
- Ignore

### Success Criteria

- Listing published
- Searchable immediately
- Appears in seller dashboard

### Error Cases

- Upload failure
- AI timeout
- Missing required fields

---

# Flow 3 — Buyer Discovers a Product

## Goal

Allow buyers to quickly locate relevant products.

### Entry Point

Homepage

### Flow

```text
Homepage
    │
    ▼
Browse Categories
    │
    ▼
Search
    │
    ▼
Apply Filters
    │
    ▼
View Results
    │
    ▼
Open Product
```

### Optional Filters

- Category
- Price
- Condition
- City
- Verified Seller
- Negotiable
- Sort

### Empty State

No products found

↓

Suggest:

- Remove filters
- Browse categories
- View recent listings

---

# Flow 4 — Product Evaluation

## Goal

Help buyers decide whether to trust a listing.

### Flow

```text
Product Page
      │
      ▼
View Photos
      │
      ▼
Read Description
      │
      ▼
Review Seller
      │
      ▼
Check Trust Score
      │
      ▼
Choose Action
```

### Available Actions

- Save Favorite
- Contact Seller
- Submit Offer
- Report Listing
- Share Listing

---

# Flow 5 — Offer Submission

## Goal

Allow buyers and sellers to negotiate.

### Buyer Journey

```text
Product Page
      │
      ▼
Submit Offer
      │
      ▼
Enter Price
      │
      ▼
Optional Message
      │
      ▼
Confirm
      │
      ▼
Seller Notification
```

### Seller Journey

```text
Notification
      │
      ▼
View Offer
      │
      ▼
Accept
Reject
(Future: Counter Offer)
```

### Success

Offer status updated.

Buyer notified.

---

# Flow 6 — Contact Seller

## Goal

Enable direct communication.

### Product Page

```text
Choose Contact Method
        │
 ┌──────┴──────┐
 ▼             ▼
Telegram      Phone
 ▼             ▼
External App Opens
```

### Notes

The marketplace does not manage conversations.

Communication continues through familiar channels.

---

# Flow 7 — Save Favorites

## Goal

Allow buyers to bookmark products.

### Flow

```text
Product
   │
   ▼
Tap Favorite
   │
   ▼
Saved
   │
   ▼
Favorites Page
```

Users may:

- Remove favorites
- Open listings
- Contact seller

---

# Flow 8 — Seller Dashboard

## Goal

Help sellers manage listings.

### Flow

```text
Dashboard
     │
     ├── Active Listings
     ├── Draft Listings
     ├── Sold Listings
     ├── Offers
     ├── Analytics
     └── Trust Score
```

### Quick Actions

- Create Listing
- Edit
- Archive
- Mark Sold
- Delete

---

# Flow 9 — Leave a Review

## Goal

Allow buyers to rate sellers.

### Flow

```text
Completed Purchase
        │
        ▼
Rate Seller
        │
        ▼
Optional Comment
        │
        ▼
Submit Review
```

### Rules

- One review per transaction
- Ratings update seller trust score

---

# Flow 10 — Report Listing

## Goal

Help the community maintain marketplace quality.

### Flow

```text
Product Page
      │
      ▼
Report Listing
      │
      ▼
Choose Reason
      │
      ▼
Optional Details
      │
      ▼
Submit
      │
      ▼
Admin Queue
```

### Report Reasons

- Spam
- Fraud
- Duplicate
- Wrong Category
- Offensive Content
- Other

---

# Flow 11 — Administrator Moderation

## Goal

Maintain marketplace integrity.

### Flow

```text
Admin Dashboard
        │
        ▼
View Reports
        │
        ▼
Review Evidence
        │
        ▼
Decision
   ┌────┼────┐
   ▼    ▼    ▼
Approve Remove Suspend
```

### Outcomes

- Report resolved
- User notified (future)
- Marketplace updated

---

# Global Navigation Flow

```text
Home
 ├── Categories
 ├── Search
 ├── Listing
 ├── Seller
 ├── Favorites
 ├── Dashboard
 ├── Notifications
 └── Profile
```

---

# Error Flow Principles

Every error should:

- Clearly explain what happened
- Tell the user how to fix it
- Never lose user data
- Offer a retry option where possible

Example:

```text
Upload Failed
      │
      ▼
Show Error
      │
      ▼
Retry Upload
```

---

# Loading State Principles

Long-running operations should display progress.

Examples:

- Skeleton cards while loading listings
- Image upload progress bars
- AI generation spinner with status
- Button loading indicators during form submission

---

# Success State Principles

Every successful action should provide immediate feedback.

Examples:

- Toast notifications
- Success banners
- Updated UI without full page refresh
- Automatic navigation where appropriate

---

# Flow Summary

The marketplace is designed around a small number of intuitive user journeys:

- Discover products quickly
- Publish listings effortlessly
- Build trust before contact
- Communicate through familiar channels
- Manage listings with minimal effort

Every flow prioritizes the product's three guiding principles:

- Trust
- Speed
- Simplicity