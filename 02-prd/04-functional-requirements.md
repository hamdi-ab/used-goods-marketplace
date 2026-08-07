# Product Requirements Document (PRD)
# 04 - Functional Requirements

> **Version:** 1.0
> **Status:** Draft
> **Owner:** Product Team
> **Priority:** Critical

# 1. Introduction

This document defines the functional requirements of the marketplace.

Each module specifies:

- Purpose
- Functional Requirements
- Validation Rules
- Business Rules
- Permissions
- Future Enhancements

These requirements define the expected behavior of the system.

# Functional Modules

The marketplace consists of the following functional modules:

1. Authentication
2. User Profile
3. Seller Verification
4. Listings
5. AI Listing Assistant
6. Search & Discovery
7. Product Details
8. Favorites
9. Offers
10. Seller Dashboard
11. Reviews & Ratings
12. Reports
13. Notifications
14. Administration

# Module 1 — Authentication

## Purpose

Allow users to securely register and access the platform.

## Functional Requirements

### FR-001

Users shall register using:

- Email
- Password

### FR-002

Users shall log in using registered credentials.

### FR-003

Users shall log out securely.

### FR-004

The system shall persist authenticated sessions.

### FR-005

Users shall reset forgotten passwords via email.

## Validation Rules

**Email:**
- Required
- Valid format
- Unique

**Password:**
- Minimum 8 characters

## Permissions

**Guest:**
- Register
- Login

**Authenticated users (Buyer / Seller / Admin):**
- Logout
- Update Profile

# Module 2 — User Profile

## Purpose

Allow users to build a trustworthy public profile.

## Functional Requirements

Users shall be able to:

- Upload profile photo
- Edit full name
- Add phone number
- Add Telegram username
- Select city
- Select sub-city
- Write short bio

## Profile Completion

The system shall calculate profile completion percentage.

**Example:**
Profile Picture: ✓
Phone: ✓
Telegram: ✓
City: ✓
Bio: ✗
Completion: 80%

# Module 3 — Seller Verification

## Purpose

Increase buyer confidence.

## Functional Requirements

Display verification indicators.

**Supported indicators:**
- Email Verified
- Telegram Linked
- Phone Verified
- Future Fayda Verified

## Trust Score

**Calculated from:**
- Profile Completion
- Successful Listings
- Ratings
- Reports
- Verification Signals

# Module 4 — Listings

## Purpose

Allow sellers to publish products.

### Listing Fields
- Title
- Description
- Price
- Category
- Condition
- City
- Sub-city
- Negotiable
- Images
- Status

## Listing Status
- Draft
- Published
- Reserved
- Sold
- Archived

## Functional Requirements

**Seller shall:**
- Create listing
- Edit listing
- Delete listing
- Archive listing
- Mark sold

## Image Upload

**Support:**
- Multiple images
- Drag & Drop
- Cover image
- Image reordering

**Maximum:** 10 images

## Supported Image Types

- JPG
- JPEG
- PNG
- WebP

# Module 5 — AI Listing Assistant

## Purpose

Reduce seller effort.

## Inputs
- Photos
- Optional Title
- Optional Description

## Outputs

**Generated:**
- Title
- Description
- Category
- Keywords
- Suggested Condition
- Listing Quality Score

## Requirements

Users may edit every AI suggestion.

Nothing is published automatically.

# Module 6 — Search

## Purpose

Help buyers discover products.

## Search Sources
- Title
- Description
- Category
- Location

## Filters
- Category
- Price Range
- Condition
- City
- Sub-city
- Verified Seller
- Negotiable
- Newest

## Sorting
- Newest
- Oldest
- Lowest Price
- Highest Price
- Most Viewed

# Module 7 — Product Details

## Product Page Includes
- Gallery
- Price
- Condition
- Description
- Location
- Seller
- Trust Panel
- Similar Listings
- Contact Buttons
- Report Button
- Favorite Button
- Offer Button

## Trust Panel

**Display:**
- Seller Rating
- Trust Score
- Verification Status
- Joined Date
- Successful Sales

# Module 8 — Favorites

**Users can:**
- Save listings
- Remove favorites
- View favorite list

# Module 9 — Offers
**Buyer**
Create Offer
↓
**Seller**
Accept
Reject
Counter (Future)

## Offer Fields
- Offer Price
- Message
- Status
- Timestamp

## Offer Status
- Pending
- Accepted
- Rejected
- Expired

# Module 10 — Seller Dashboard

**Dashboard Displays:**
- Active Listings
- Sold Listings
- Draft Listings
- Views
- Favorites
- Offers
- Trust Score
- Listing Analytics

## Listing Analytics

**Metrics:**
- Views
- Favorites
- Offers
- Published Date
- Status

# Module 11 — Reviews

**Buyer can:**
- Rate seller
- 1–5 Stars
- Optional Comment

**Rules:**
One review per completed transaction.

Seller cannot review themselves.

# Module 12 — Reports

**Reasons:**
Spam

Fraud

Duplicate

Wrong Category

Offensive Content

Other

**Report Flow:**
Submit
↓
Admin Review
↓
Resolved

# Module 13 — Notifications

**System shall notify users when:**
- Offer Received
- Offer Accepted
- Offer Rejected
- Listing Sold
- Listing Reported
- Listing Approved

**Notification Channels:**
- In-App
- Email (Future)

# Module 14 — Administration

**Administrator can:**
- View Users
- View Listings
- Remove Listings
- Suspend Users
- Resolve Reports
- View Marketplace Statistics

# Marketplace Statistics

Display

Total Users

Total Listings

Verified Sellers

Products Sold

Reports

Active Listings

# Permissions Matrix

| Feature | Guest | Buyer | Seller | Admin |
|----------|:----:|:-----:|:------:|:-----:|
| Browse Listings | ✓ | ✓ | ✓ | ✓ |
| Search | ✓ | ✓ | ✓ | ✓ |
| Register | ✓ | | | |
| Login | ✓ | | | |
| Favorite | | ✓ | ✓ | ✓ |
| Submit Offer | | ✓ | | |
| Create Listing | | | ✓ | ✓ |
| Edit Own Listing | | | ✓ | ✓ |
| Delete Own Listing | | | ✓ | ✓ |
| Review Seller | | ✓ | | |
| Report Listing | ✓ | ✓ | ✓ | ✓ |
| Moderate Reports | | | | ✓ |
| Manage Users | | | | ✓ |

# Validation Rules

## Listing Title
- Required
- Minimum: 5 characters
- Maximum: 120 characters

## Description
- Required
- Minimum: 20 characters
- Maximum: 2,000 characters

## Price
- Required
- Greater than zero

## Images
- Minimum: 1
- Maximum: 10

## Phone Number
- Required for Sellers
- Must follow Ethiopian phone number format.

# Business Rules

**BR-001:** Users may only edit their own listings.

**BR-002:** Archived listings remain searchable only by their owner.

**BR-003:** Sold listings remain visible but cannot receive new offers.

**BR-004:** Trust Score updates automatically after profile or transaction changes.

**BR-005:** Deleting a listing performs a soft delete.

**BR-006:** AI-generated content is always editable before publishing.

**BR-007:** Users may report the same listing only once.

**BR-008:** A seller cannot submit offers on their own listing.

**BR-009:** Only authenticated users can create listings.

**BR-010:** Guests can browse and search without logging in.

# Future Functional Enhancements

The architecture should support:

- Fayda Verification
- Telebirr Payments
- Chapa Payments
- Delivery Services
- Saved Searches
- AI Price Estimation
- Recommendation Engine
- Mobile Applications
- Business Accounts
- Push Notifications

# Functional Requirement Summary

The MVP delivers a complete marketplace experience covering:

- Secure authentication
- Structured listing management
- AI-assisted selling
- Powerful search
- Transparent trust systems
- Favorites and offers
- Seller analytics
- Community moderation

These functional requirements define the minimum implementation needed to deliver a production-quality marketplace for the VinTech Challenge while leaving a clear path for future expansion.
