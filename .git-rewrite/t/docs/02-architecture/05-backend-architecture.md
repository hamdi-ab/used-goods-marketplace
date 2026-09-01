# Backend Architecture

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Draft
>
> **Owner:** Backend Team

# 1. Purpose

This document defines the backend architecture for the marketplace.

Although the MVP uses Supabase, the backend is designed with clear architectural boundaries so that it can later migrate to NestJS, ASP.NET, Go, or another backend framework without changing business rules.

Objectives:

- Separation of concerns
- High maintainability
- Easy testing
- Scalable business logic
- Vendor independence

# 2. High-Level Architecture

```text
                Client (Next.js)

                      │

          Server Actions / API Routes

                      │

              Validation Layer

                      │

              Application Services

                      │

             Business Domain Layer

                      │

            Repository / Data Access

                      │

         Supabase (Database + Storage)
```

# 3. Backend Layers

## Presentation Layer

**Responsibilities:** Accept requests, Authenticate users, Parse input, Return responses

Examples

```
POST /api/v1/listings

GET /api/v1/search
```

No business logic exists here.

## Validation Layer

**Responsibilities:** Validate request body, Validate query parameters, File validation, Authorization checks

**Technology:** Zod

Example

```ts
ListingSchema.parse(request.body)
```

## Application Layer

Coordinates use cases.

Examples

```
CreateListing

SearchListings

AcceptOffer

GenerateAIListing
```

**Responsibilities:** Execute workflows, Call repositories, Publish events

No SQL.

No UI logic.

## Domain Layer

Contains business rules.

Examples

```
Listing

Offer

Seller

Trust Score

Verification
```

**Responsibilities:** Business invariants, Domain rules, Calculations

Example

```
A seller cannot make an offer on their own listing.
```

## Repository Layer

**Purpose:** Abstract database access.

Example

```
ListingRepository

OfferRepository

ProfileRepository
```

**Responsibilities:** CRUD operations, Queries, Transactions

Only this layer knows Supabase.

## Infrastructure Layer

Contains integrations.

**Examples:** Supabase, Gemini API, Storage, Future Telebirr, Future Fayda

Changing providers should only affect this layer.

# 4. Project Structure

```text
backend/

├── app/
│
├── api/
│
├── services/
│
├── domain/
│
├── repositories/
│
├── infrastructure/
│
├── validation/
│
├── events/
│
├── types/
│
└── utils/
```

# 5. Request Lifecycle

**Example:** Create Listing

```text
HTTP Request

↓

Validate

↓

Authenticate

↓

Application Service

↓

Business Rules

↓

Repository

↓

Database

↓

Response
```

# 6. Application Services

Each service represents one use case.

Examples

```
CreateListingService

UpdateListingService

DeleteListingService

SearchListingsService

FavoriteListingService

CreateOfferService

AcceptOfferService

RejectOfferService

GenerateAIListingService

CalculateTrustScoreService
```

Each service performs one responsibility.

# 7. Repository Pattern

Repositories isolate persistence.

Example

```
ListingRepository
```

Methods

```
create()

update()

delete()

findById()

findMany()

search()

markSold()
```

Future migrations require changing only repository implementations.

# 8. Domain Events

Business events trigger additional actions.

Examples

```
ListingCreated

OfferSubmitted

OfferAccepted

ListingSold

ReviewCreated

VerificationApproved
```

Consumers

```
Notification Service

Analytics

Trust Score

Future Email

Future Push Notifications
```

# 9. AI Integration

The AI service is isolated.

```text
Frontend

↓

GenerateListingService

↓

Gemini Provider

↓

Structured Result

↓

Frontend
```

The frontend never communicates directly with Gemini.

# 10. Storage Flow

```text
Image Upload

↓

Validation

↓

Compression

↓

Supabase Storage

↓

Public URL

↓

Listing Saved
```

# 11. Transactions

Critical operations execute atomically.

**Examples:** Offer Accepted

```
Update Offer

↓

Update Listing

↓

Create Notification

↓

Commit
```

Rollback on failure.

# 12. Authorization

Implemented in multiple layers.

1. JWT Authentication
2. Role Validation
3. Ownership Validation
4. Row Level Security

Example

```
Only listing owner may edit listing.
```

# 13. Error Handling

Application errors

```
ValidationError

BusinessRuleViolation

Unauthorized

NotFound

Conflict
```

Infrastructure errors

```
Storage Failure

Database Failure

AI Timeout
```

Responses are standardized.

# 14. Logging

**Log:** Requests, Errors, AI calls, Listing creation, Moderation actions

**Never log:** Passwords, JWTs, Sensitive user data

# 15. Background Jobs (Future)

**Future asynchronous tasks:** AI processing, Email delivery, Search indexing, Analytics aggregation, Image optimization

# 16. Configuration

Environment variables

```
SUPABASE_URL

SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

GEMINI_API_KEY

APP_URL
```

Never hardcode secrets.

# 17. Backend Security

**Layers:** HTTPS, JWT, Input Validation, Output Sanitization, RLS, Rate Limiting, Audit Logging

# 18. Testing Strategy

**Unit Tests:** Domain, Services

**Integration Tests:** Repositories, API Endpoints

**End-to-End Tests:** Complete user flows

# 19. Future Evolution

The architecture supports future migration to:

- NestJS
- ASP.NET Core
- Go Fiber
- FastAPI

because business logic remains independent from Supabase.

# 20. Summary

The backend architecture follows Clean Architecture principles.

Business logic is isolated from infrastructure, allowing the marketplace to evolve without large-scale refactoring.

By separating validation, services, domain logic, repositories, and integrations, the system remains testable, maintainable, and scalable while still taking advantage of Supabase for rapid MVP development.