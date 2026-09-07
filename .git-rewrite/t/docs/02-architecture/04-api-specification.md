# API Specification

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **API Version:** v1
>
> **Style:** REST
>
> **Authentication:** JWT (Supabase Auth)
>
> **Status:** Draft

# 1. Overview

This document defines the REST API contract for the marketplace.

All endpoints return JSON.

Authentication uses Bearer JWT tokens issued by Supabase Authentication.

# 2. API Principles

- RESTful resource naming
- Stateless requests
- Predictable URLs
- Consistent error responses
- Cursor/page pagination
- Standard HTTP status codes
- Versioned endpoints

Base URL

```
/api/v1
```

All endpoint paths in this document are relative to the base URL unless stated otherwise (for example, `/listings` resolves to `/api/v1/listings`).

# 3. Authentication

Protected endpoints require

```
Authorization: Bearer <JWT_TOKEN>
```

Success

```
200 OK
```

Unauthorized

```
401 Unauthorized
```

Forbidden

```
403 Forbidden
```

# 4. Standard Response Format

## Success

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully."
}
```

## Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required."
  }
}
```

# 5. Authentication Endpoints

## Register

POST

```
/auth/register
```

Body

```json
{
  "email": "user@example.com",
  "password": "********"
}
```

Response

```
201 Created
```

## Login

POST

```
/auth/login
```

Response

```
200 OK
```

**Returns:** JWT, User Profile

## Logout

POST

```
/auth/logout
```

## Refresh Token

POST

```
/auth/refresh
```

# 6. Profile Endpoints

## Get Profile

GET

```
/profile
```

## Update Profile

PATCH

```
/profile
```

**Editable:** Name, Phone, Telegram, Avatar, Bio, City, Sub-city

## Public Seller Profile

GET

```
/seller/{sellerId}
```

**Returns:** Seller Info, Rating, Trust Score, Active Listings

# 7. Category Endpoints

## List Categories

GET

```
/categories
```

## Category Details

GET

```
/categories/{slug}
```

# 8. Listing Endpoints

## Get Listings

GET

```
/listings
```

Query Parameters

```
page

limit

category

city

condition

minPrice

maxPrice

sort
```

The dedicated search endpoint is `GET /search` (Section 17).

## Get Listing

GET

```
/listings/{id}
```

## Create Listing

POST

```
/listings
```

**Authentication:** Required

Body

```json
{
  "title": "",
  "description": "",
  "categoryId": "",
  "price": 0,
  "condition": "",
  "negotiable": false
}
```

Returns

```
201 Created
```

## Update Listing

PATCH

```
/listings/{id}
```

Only owner.

## Delete Listing

DELETE

```
/listings/{id}
```

Soft delete.

## Mark Sold

PATCH

```
/listings/{id}/sold
```

## Upload Images

POST

```
/listings/{id}/images
```

**Multipart Form Data:** Maximum

10 images

# 9. AI Endpoints

## Generate Listing

POST

```
/ai/listing
```

**Input:** Images, Optional Title, Optional Description

Returns

```json
{
  "title": "",
  "description": "",
  "category": "",
  "condition": "",
  "keywords": [],
  "qualityScore": 94
}
```

# 10. Favorite Endpoints

## Add Favorite

POST

```
/favorites
```

## Remove Favorite

DELETE

```
/favorites/{listingId}
```

## My Favorites

GET

```
/favorites
```

# 11. Offer Endpoints

## Create Offer

POST

```
/offers
```

Body

```json
{
  "listingId": "",
  "amount": 10000,
  "message": ""
}
```

## Seller Offers

GET

```
/offers/seller
```

## Buyer Offers

GET

```
/offers/buyer
```

## Accept Offer

PATCH

```
/offers/{id}/accept
```

## Reject Offer

PATCH

```
/offers/{id}/reject
```

# 12. Review Endpoints

## Create Review

POST

```
/reviews
```

Requires an accepted offer ID (one review per completed transaction).

Body

```json
{
  "offerId": "",
  "rating": 5,
  "comment": ""
}
```

## Seller Reviews

GET

```
/seller/{sellerId}/reviews
```

# 13. Report Endpoints

## Report Listing

POST

```
/reports
```

Body

```json
{
  "listingId": "",
  "reason": "",
  "description": ""
}
```

# 14. Notification Endpoints

## My Notifications

GET

```
/notifications
```

## Mark Read

PATCH

```
/notifications/{id}
```

# 15. Verification Endpoints

## Request Verification

POST

```
/verification
```

## Verification Status

GET

```
/verification
```

# 16. Dashboard Endpoints

## Dashboard Summary

GET

```
/dashboard
```

**Returns:** Active Listings, Drafts, Sold, Offers, Analytics

# 17. Search

GET

```
/search
```

Parameters

```
query

category

city

condition

minPrice

maxPrice

sort
```

# 18. Pagination

Request

```
?page=2&limit=20
```

Response

```json
{
  "data": [],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 187,
    "pages": 10
  }
}
```

# 19. Sorting

Supported

```
newest

oldest

price_asc

price_desc

most_viewed
```

# 20. HTTP Status Codes

| Code | Meaning |
|------|---------|
|200|Success|
|201|Created|
|204|Deleted / No Content|
|400|Validation Error|
|401|Unauthorized|
|403|Forbidden|
|404|Not Found|
|409|Conflict|
|422|Business Rule Violation|
|429|Rate Limited|
|500|Internal Error|

# 21. Validation Rules

**Listing:** Title

5–120 characters

**Description:** 20–2000 characters

**Price:** Greater than zero

**Images:** Maximum 10

**Offers:** Cannot exceed decimal precision

**Reviews:** Rating

1–5

# 22. Rate Limiting

Anonymous

```
100 requests/hour
```

Authenticated

```
1000 requests/hour
```

AI

```
20 generations/day/user
```

# 23. Security

**JWT Authentication:** HTTPS

**Input Validation:** Output Encoding

**Rate Limiting:** Row Level Security

Audit Logging

# 24. Versioning

Current

```
v1
```

Future

```
/api/v2
```

Older versions remain supported during migration windows.

# 25. Future APIs

- Payments
- Delivery Tracking
- Saved Searches
- Recommendations
- Chat
- Push Notifications
- Business Accounts

# 26. Summary

The REST API is designed to provide a consistent, secure, and scalable interface between the frontend and backend.

Its resource-oriented design, standardized responses, and clear authentication model allow frontend and backend teams to work independently while supporting future expansion without breaking existing clients.