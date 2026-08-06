# Product Requirements Document (PRD)
# 02 - User Personas

> **Version:** 1.0
> **Status:** Draft
> **Owner:** Product Team
> **Related Documents:**
> - 00-overview.md
> - 01-goals.md

---

# 1. Introduction

This document defines the primary user groups for the marketplace.

Rather than describing generic demographics, these personas focus on user goals, behaviors, frustrations, and motivations.

Every feature in the product should solve a real problem experienced by one or more of these personas.

---

# 2. Primary Persona A — Student Buyer

## Overview

University students represent one of the largest markets for second-hand goods in Ethiopia.

They frequently buy affordable electronics, furniture, books, and household items due to limited budgets.

---

## Profile

**Age**

18–26

**Occupation**

University Student

**Technical Experience**

High

**Shopping Frequency**

Frequent

---

## Goals

- Find affordable products.
- Compare prices.
- Buy from trustworthy sellers.
- Contact sellers quickly.
- Save money.

---

## Common Purchases

- Smartphones
- Laptops
- Desks
- Chairs
- Books
- Small appliances

---

## Pain Points

- Endless Telegram scrolling.
- Fake listings.
- Missing prices.
- Poor quality photos.
- Sellers who never reply.
- No easy comparison.

---

## Product Needs

- Fast search.
- Filters.
- Seller trust indicators.
- Favorites.
- Similar products.

---

## Success Criteria

"I found exactly what I wanted in a few minutes."

---

# 3. Primary Persona B — Young Professional Seller

## Overview

Young professionals regularly upgrade devices and household items.

They want a fast and professional way to sell.

---

## Profile

**Age**

24–35

**Occupation**

Professional

**Technical Experience**

Medium to High

---

## Goals

- Sell quickly.
- Reach serious buyers.
- Build credibility.
- Avoid repetitive conversations.
- Receive fair offers.

---

## Common Listings

- Phones
- Laptops
- Furniture
- Home appliances
- Office equipment

---

## Pain Points

- Writing listings.
- Pricing uncertainty.
- Low-quality buyer inquiries.
- Repeated questions.
- No reputation.

---

## Product Needs

- AI Listing Assistant.
- Listing analytics.
- Trust Score.
- Offer management.
- Multiple images.

---

## Success Criteria

"My item was listed in under one minute."

---

# 4. Primary Persona C — Family Buyer

## Overview

Families often search for affordable furniture, appliances, and household goods.

Their purchases are less frequent but involve higher value.

---

## Goals

- Save money.
- Buy quality items.
- Purchase from trustworthy sellers.
- Inspect detailed product information.

---

## Common Purchases

- Sofas
- Refrigerators
- Washing machines
- Dining tables
- Beds

---

## Pain Points

- Unclear condition.
- Missing descriptions.
- Hidden damage.
- Unresponsive sellers.

---

## Product Needs

- Large photos.
- Condition details.
- Seller ratings.
- Trust Score.
- Rich descriptions.

---

## Success Criteria

"I felt confident before contacting the seller."

---

# 5. Primary Persona D — Local Merchant

## Overview

Some small merchants regularly buy and resell used goods.

They care about speed and inventory availability.

---

## Goals

- Find inventory quickly.
- Compare prices.
- Contact sellers immediately.
- Monitor new listings.

---

## Pain Points

- Slow discovery.
- Duplicate listings.
- Missing contact information.

---

## Product Needs

- Search.
- Saved searches.
- Trending listings.
- Recent listings.
- Quick contact.

---

## Success Criteria

"I can discover inventory before everyone else."

---

# 6. Administrator Persona

## Overview

Administrators protect marketplace quality.

They ensure trust and remove abuse.

---

## Responsibilities

- Review reports.
- Moderate listings.
- Remove spam.
- Review verification requests.
- Monitor marketplace activity.

---

## Goals

- Keep listings legitimate.
- Prevent fraud.
- Improve marketplace quality.

---

## Product Needs

- Moderation tools.
- Reporting dashboard.
- Listing review queue.
- User management.

---

# 7. Shared User Pain Points

Across all personas, the same problems repeatedly appear.

- Difficult search.
- Low trust.
- Poor listing quality.
- Fake accounts.
- Missing information.
- Time-consuming communication.
- No reputation system.
- Poor organization.

These problems define the core product opportunity.

---

# 8. Shared User Motivations

Users want:

- Simplicity.
- Trust.
- Speed.
- Transparency.
- Fair pricing.
- Reliable communication.

Every major feature should support at least one of these motivations.

---

# 9. Persona Feature Mapping

| Feature | Student | Seller | Family | Merchant | Admin |
|----------|:-------:|:------:|:------:|:--------:|:-----:|
| Search | ✓ | | ✓ | ✓ | |
| Categories | ✓ | | ✓ | ✓ | |
| Filters | ✓ | | ✓ | ✓ | |
| AI Listing Assistant | | ✓ | | | |
| Trust Score | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ratings | ✓ | ✓ | ✓ | ✓ | ✓ |
| Favorites | ✓ | | ✓ | ✓ | |
| Offers | ✓ | ✓ | | ✓ | |
| Reports | ✓ | ✓ | ✓ | ✓ | ✓ |
| Seller Dashboard | | ✓ | | | |
| Analytics | | ✓ | | ✓ | |
| Similar Listings | ✓ | | ✓ | ✓ | |

---

# 10. Design Implications

These personas directly influence product design.

Examples:

Student Buyers need:

- Fast navigation.
- Mobile-first experience.
- Clear pricing.

Family Buyers need:

- Larger images.
- Detailed condition information.
- Strong trust indicators.

Sellers need:

- Minimal listing effort.
- AI assistance.
- Analytics.

Administrators need:

- Efficient moderation tools.
- Clear reporting workflows.

---

# 11. Persona Prioritization

The MVP prioritizes the following order:

1. Buyer
2. Seller
3. Administrator

Marketplace success depends primarily on creating excellent buyer and seller experiences.

Administrative capabilities should remain lightweight but effective.

---

# 12. Key Insight

Although these personas differ in goals, they all value the same three outcomes:

- Trust
- Speed
- Simplicity

These principles remain the foundation of every feature, workflow, and design decision throughout the product.