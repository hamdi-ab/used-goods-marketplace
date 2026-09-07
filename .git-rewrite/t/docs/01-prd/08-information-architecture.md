# Information Architecture (IA)

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Draft
>
> **Owner:** Product & UX Team

# 1. Purpose

This document defines the structural organization of the marketplace.

It specifies:

- Site hierarchy
- Navigation
- Route structure
- Page ownership
- Layout hierarchy
- Access permissions
- URL strategy
- Content organization

The goal is to create a navigation system that feels intuitive while remaining scalable as new features are added.

# 2. Architecture Principles

The information architecture is guided by six principles.

## Principle 1 — Simplicity

Users should reach any important feature within three interactions.

## Principle 2 — Discoverability

Products should always be easy to find.

Search and browsing receive the highest navigation priority.

## Principle 3 — Trust

Seller information should always be accessible.

Trust should never be hidden.

## Principle 4 — Mobile First

Navigation should require minimal thumb movement.

## Principle 5 — Scalability

Future features should fit naturally into the navigation without redesigning the application.

## Principle 6 — Consistency

Navigation behavior should remain consistent across desktop and mobile devices.

# 3. Site Map

```text
Marketplace

├── Home
│
├── Browse
│   ├── Categories
│   ├── Search
│   ├── Results
│   └── Product Details
│
├── Sell
│   ├── Create Listing
│   ├── Drafts
│   └── Published Listings
│
├── Favorites
│
├── Notifications
│
├── Dashboard
│   ├── Overview
│   ├── Listings
│   ├── Offers
│   ├── Analytics
│   ├── Reviews
│   └── Settings
│
├── Seller Profile
│
├── User Profile
│
├── Authentication
│   ├── Login
│   ├── Register
│   └── Forgot Password
│
└── Admin
    ├── Dashboard
    ├── Listings
    ├── Users
    ├── Reports
    └── Statistics
```

# 4. Primary Navigation

The primary navigation appears on every page.

Desktop Navigation

```text
Home

Browse

Sell

Favorites

Dashboard

Profile
```

Mobile Navigation

```text
🏠 Home

🔍 Search

➕

Sell

❤️ Favorites

👤 Profile
```

The Dashboard is accessed from the Profile tab on mobile to keep the bottom navigation uncluttered.

# 5. Footer Navigation

Footer contains secondary pages.

- About
- Help Center
- Safety Tips
- Terms of Service
- Privacy Policy
- Contact

# 6. Route Structure

## Public Routes

```text
/

```

Homepage

```text
/search

```

Search Results

```text
/categories

```

Categories

```text
/category/[slug]

```

Category

```text
/listing/[slug]

```

Listing Details

```text
/seller/[username]

```

Seller Profile

```text
/about

```

```text
/help

```

```text
/privacy

```

```text
/terms
```

## Authentication Routes

```text
/login

/register

/forgot-password
```

## Protected Routes

```text
/dashboard

/dashboard/listings

/dashboard/offers

/dashboard/analytics

/dashboard/reviews

/dashboard/settings
```

## Seller Routes

```text
/sell

/sell/new

/sell/edit/[id]

/sell/drafts
```

## Buyer Routes

```text
/favorites

/offers

/profile
```

## Admin Routes

```text
/admin

/admin/users

/admin/listings

/admin/reports

/admin/statistics
```

# 7. Layout Architecture

## Public Layout

Contains

- Navigation
- Footer

Used by:

- Home
- Search
- Categories
- Product Pages

## Authentication Layout

Minimal layout

Contains only

- Logo
- Form
- Background illustration

## Dashboard Layout

Contains

- Sidebar
- Top Navigation
- Breadcrumb
- Main Content

## Admin Layout

Contains

- Admin Sidebar
- Admin Header
- Content Area

# 8. Breadcrumb Structure

Example

```text
Home

↓

Electronics

↓

Mobile Phones

↓

iPhone 13 Pro
```

Seller Dashboard

```text
Dashboard

↓

Listings

↓

Edit Listing
```

# 9. Search Hierarchy

Search prioritizes:

1. Product Title
2. Category
3. Brand
4. Description
5. Keywords
6. Seller Name

# 10. Category Architecture

```text
Electronics
│
├── Phones
├── Laptops
├── Tablets
├── Cameras
├── Accessories

Furniture
│
├── Living Room
├── Bedroom
├── Office

Home Appliances
│
├── Kitchen
├── Laundry
├── Cleaning

Vehicles
│
├── Cars
├── Motorcycles
├── Bicycles

Fashion
│
├── Men
├── Women
├── Shoes
├── Bags

Books

Sports

Baby & Kids

Other
```

# 11. Listing Information Hierarchy

The product page should present information in the following order.

1. Product Images
2. Price
3. Title
4. Condition Badge
5. Seller Trust Panel
6. Description
7. Product Details
8. Location
9. Similar Listings

This order reflects how buyers evaluate second-hand products.

# 12. Seller Profile Hierarchy

Seller Page

```text
Profile Photo

↓

Name

↓

Trust Score

↓

Verification Badges

↓

Ratings

↓

Member Since

↓

Active Listings

↓

Reviews
```

# 13. Dashboard Information Hierarchy

Dashboard

```text
Quick Stats

↓

Active Listings

↓

Offers

↓

Analytics

↓

Recent Activity
```

# 14. Access Control Matrix

| Page | Guest | Buyer | Seller | Admin |
|------|:----:|:----:|:------:|:------:|
| Homepage | ✅ | ✅ | ✅ | ✅ |
| Search | ✅ | ✅ | ✅ | ✅ |
| Product Page | ✅ | ✅ | ✅ | ✅ |
| Seller Profile | ✅ | ✅ | ✅ | ✅ |
| Favorites | ❌ | ✅ | ✅ | ❌ |
| Dashboard | ❌ | ✅ | ✅ | ❌ |
| Create Listing | ❌ | ❌ | ✅ | ❌ |
| Admin | ❌ | ❌ | ❌ | ✅ |

*Admin is moderation-only (ADR-020). Reads: admins can inspect any marketplace page (listing, profile, search) and the console pages render harmlessly. Writes: all trading writes are blocked (no selling, offering, favoriting, reviewing, contacting, reporting), and `/admin` is the admin's home — reached from the account menu and post-login landing. Favorites/Dashboard/Create Listing are not part of the admin's navigation or landing.*

# 15. URL Design Guidelines

URLs should be:

- Human-readable
- SEO-friendly
- Predictable
- Stable

Example

Good

```text
/listing/iphone-13-pro-256gb
```

Bad

```text
/listing?id=82738273
```

# 16. Empty State Strategy

Every page should define meaningful empty states.

Examples

Favorites

"You haven't saved any listings yet."

Search

"No products match your filters."

Dashboard

"You haven't published any listings."

Offers

"No offers yet."

Each empty state should include a clear call-to-action.

# 17. Error Page Strategy

Custom pages

- 404
- 403
- 500

Each page should provide:

- Clear explanation
- Navigation back to safety
- Search option where appropriate

# 18. SEO Architecture

Public pages should include:

- Title
- Meta Description
- Open Graph Image
- Structured Data (JSON-LD)
- Canonical URL

Sitemap should include:

- Homepage
- Categories
- Public Listings
- Seller Profiles

# 19. Future Expansion

The architecture is designed to support future modules without disrupting the existing navigation.

Planned additions include:

- Payments
- Delivery Tracking
- Saved Searches
- AI Price Estimation
- Push Notifications
- Business Accounts
- Mobile Applications

# 20. Summary

The Information Architecture provides a scalable blueprint for organizing the marketplace.

By prioritizing simplicity, trust, and discoverability, the structure enables users to quickly find products, evaluate sellers, and complete key tasks with minimal effort.

This document serves as the foundation for wireframes, UI design, frontend routing, backend authorization, and future platform growth.