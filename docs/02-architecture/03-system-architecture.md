# System Architecture

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Draft
>
> **Owner:** CTO / Engineering Team

# 1. Overview

## Purpose

This document describes the complete technical architecture of the Used Goods Marketplace.

It explains how every system interacts, where data lives, how requests flow through the platform, and how the application can scale as adoption grows.

This architecture is designed around the following principles:

- Simplicity
- Performance
- Scalability
- Security
- Maintainability
- Cost = $0 for MVP

# 2. High-Level Architecture

```text
                    Users
                      │
         ┌────────────┴────────────┐
         │                         │
     Desktop                  Mobile Browser
         │                         │
         └────────────┬────────────┘
                      │
               Next.js Frontend
          (React + TypeScript + Tailwind)
                      │
         ┌────────────┴─────────────┐
         │                          │
      Supabase API             AI Service
         │                     (Gemini API)
         │
 ┌───────┼─────────────────────────────────┐
 │       │            │          │          │
 │ PostgreSQL     Auth      Storage     Realtime
 │ Database     (JWT)      Images      Events
 └───────┼─────────────────────────────────┘
         │
   Edge Functions
         │
 ┌───────┴──────────────────────┐
 │                              │
Notifications             Future Integrations
                           Telebirr
                           Chapa
                           Fayda
```

# 3. Architecture Style

The application follows a modern serverless architecture.

## Frontend

- Next.js 15
- React Server Components
- Client Components where necessary
- App Router

## Backend

**Backend-as-a-Service:** Supabase provides:

- Authentication
- PostgreSQL
- Storage
- Realtime
- Edge Functions
- Row Level Security

## AI Layer

**Google Gemini API:** Responsibilities

- Listing Generation
- Description Improvement
- Category Prediction
- Condition Suggestion

# 4. Logical Architecture

```text
Presentation Layer

↓

Application Layer

↓

Business Logic Layer

↓

Data Access Layer

↓

Database
```

## Presentation Layer

**Responsibilities:** UI, Forms, Validation, Navigation

**Technology:** Next.js, React, TailwindCSS, shadcn/ui

## Application Layer

**Responsibilities:** API Requests, State Management, Authentication, Routing

**Technology:** TanStack Query, React Context, Server Actions

## Business Layer

**Responsibilities:** Listing Rules, Offer Rules, Trust Score, Review Logic

**Implemented using:** Edge Functions, Shared TypeScript Utilities

## Data Layer

**Responsibilities:** PostgreSQL, Storage, Authentication

**Managed by:** Supabase

# 5. Major Services

## Authentication Service

**Responsibilities:** Registration, Login, Session, JWT, Authorization

**Provider:** Supabase Auth

## Listing Service

**Responsibilities:** CRUD Listings, Upload Images, Archive, Sold Status

## Search Service

**Responsibilities:** Keyword Search, Filtering, Sorting, Pagination

**Future:** Full-text search

## Trust Service

**Responsibilities:** Calculate

- Seller Score
- Profile Completion
- Verification
- Reviews

## Offer Service

**Responsibilities:** Create Offer, Accept, Reject

## Notification Service

**Responsibilities:** Offer Notifications, Listing Updates

**MVP:** Realtime

**Future:** Email

Push Notifications

## AI Service

**Responsibilities:** Generate

- Title
- Description
- Category
- Keywords
- Quality Score

# 6. Data Flow

## User Registration

```text
Browser

↓

Frontend

↓

Supabase Auth

↓

Profile Created

↓

Dashboard
```

## Listing Creation

```text
Upload Images

↓

Storage

↓

Generate AI

↓

Save Listing

↓

Database

↓

Search Index
```

## Product Search

```text
Search Input

↓

API

↓

PostgreSQL

↓

Filtered Results

↓

Frontend
```

# 7. Request Lifecycle

**Example:** View Listing

```text
Browser

↓

Next.js Route

↓

Supabase Query

↓

PostgreSQL

↓

Response

↓

React UI
```

# 8. Authentication Flow

```text
Register

↓

JWT Issued

↓

Stored Session

↓

Protected Routes

↓

RLS Validation
```

# 9. Authorization Model

Guest

↓

Browse Only

Buyer

↓

Favorites

Offers

Seller

↓

Listings

Dashboard

Administrator

↓

Moderation

Reports

Analytics

# 10. File Storage

**Storage Provider:** Supabase Storage

Buckets

```text
avatars/

listing-images/

documents/

future-verification/
```

Image Pipeline

```text
Upload

↓

Validation

↓

Compression

↓

Storage

↓

Public URL
```

# 11. Caching Strategy

**Cache:** Homepage

**Categories:** Popular Listings

**Seller Profiles:** Search Results

**Dynamic:** Offers

**Dashboard:** Notifications

# 12. Security Layers

Layer 1

HTTPS

↓

Layer 2

Authentication

↓

Layer 3

Authorization

↓

Layer 4

RLS

↓

Layer 5

Validation

↓

Layer 6

Audit Logs

# 13. Scalability Strategy

**Initial Design Targets:** 10,000 users, 50,000 listings, 500 concurrent users

**Current Architecture Supports:** Thousands of users, Thousands of listings, Image CDN, Stateless frontend

**Future Scaling:** Redis Cache, Search Engine, Background Workers, Queue Processing

# 14. Error Handling

**Client Errors:** 400

401

403

404

Validation

**Server Errors:** 500

503

**Recovery:** Retry

**Graceful Fallback:** Toast Notification

# 15. Monitoring

**Metrics:** Login Success, Listing Creation, AI Usage, Search Time, API Latency, Upload Success

**Future:** Sentry

PostHog

# 16. Deployment Architecture

```text
Developer

↓

GitHub

↓

GitHub Actions

↓

Vercel

↓

Production

↓

Supabase
```

# 17. Environment Separation

Development

↓

Preview

↓

Production

Each environment uses:

- Separate database
- Separate storage
- Separate environment variables

# 18. External Integrations

**Current:** Gemini API

**Future:** Fayda Verification, Telebirr, Chapa, SMS Gateway, Email Provider

# 19. Technology Responsibilities

| Component | Technology |
|------------|------------|
| Frontend | Next.js |
| Language | TypeScript |
| Styling | TailwindCSS |
| UI | shadcn/ui |
| Backend | Supabase |
| Database | PostgreSQL |
| Storage | Supabase Storage |
| Authentication | Supabase Auth |
| AI | Gemini API |
| Deployment | Vercel |
| Version Control | GitHub |

# 20. Architecture Decisions (ADRs)

The full rationale for each decision lives in `04-architecture-decision-records.md`. The numbers here match the canonical ADR document.

## ADR-001

Use Serverless Architecture.

Reason:

Zero infrastructure cost.

## ADR-003

Use Supabase instead of building a custom backend.

Reason:

Faster development and built-in authentication.

## ADR-009

Use Gemini instead of OpenAI.

Reason:

Generous free tier for hackathon development.

## ADR-002

Use Next.js App Router.

Reason:

Performance, SEO, and Server Components.

## ADR-011

Store images in Supabase Storage.

Reason:

Integrated security, CDN support, and signed URLs.

# 21. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| AI service unavailable | Manual listing creation always available |
| Large image uploads | Client-side compression and size limits |
| Spam listings | Reports, Trust Score, moderation |
| High search latency | Indexed queries and pagination |
| Unauthorized access | Supabase RLS + JWT validation |

# 22. Future Evolution

The architecture is designed to support:

- Native mobile apps
- Microservices (if required)
- Payment processing
- Delivery tracking
- AI recommendations
- Real-time chat
- Seller subscriptions
- Business storefronts

without major architectural changes.

# 23. Summary

The system follows a modern serverless architecture optimized for rapid development, low operational cost, and future scalability.

By leveraging Next.js, Supabase, and Gemini, the platform delivers a production-quality foundation while remaining entirely within the constraints of a zero-dollar MVP budget.

This architecture balances simplicity, maintainability, and performance, making it well-suited for the VinTech Challenge and for continued development beyond the competition.