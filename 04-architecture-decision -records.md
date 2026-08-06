# Architecture Decision Records (ADR)

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Accepted
>
> **Owner:** CTO

---

# Introduction

This document records the significant architectural decisions made during the design of the marketplace.

Each ADR explains:

- The problem
- Available options
- Decision
- Rationale
- Trade-offs
- Consequences

This ensures future contributors understand *why* technologies and patterns were selected.

---

# ADR-001
## Architecture Style

### Status

Accepted

---

### Problem

The platform requires rapid development, zero infrastructure cost, strong scalability, and minimal DevOps overhead.

---

### Options

- Monolithic Server
- Serverless Architecture
- Microservices

---

### Decision

Adopt a **Serverless Architecture**.

---

### Rationale

Serverless eliminates server management, reduces operational complexity, and aligns with the challenge's budget constraints.

Supabase and Vercel provide managed infrastructure that scales automatically.

---

### Trade-offs

Pros

- Zero server maintenance
- Automatic scaling
- Fast development
- Low operational cost

Cons

- Vendor dependence
- Execution time limits for serverless functions
- Less control over infrastructure

---

# ADR-002
## Frontend Framework

### Status

Accepted

---

### Problem

The frontend must provide excellent SEO, responsiveness, and developer productivity.

---

### Options

- React + Vite
- Next.js
- Nuxt
- Angular

---

### Decision

Use **Next.js App Router**.

---

### Rationale

Next.js provides:

- Server Components
- Built-in routing
- Image optimization
- Metadata management
- Excellent SEO
- Vercel integration

These capabilities directly benefit a marketplace application.

---

### Trade-offs

Pros

- SEO
- Performance
- Routing
- Server Actions
- Built-in optimization

Cons

- Steeper learning curve
- More conventions

---

# ADR-003
## Backend Platform

### Status

Accepted

---

### Problem

The application requires authentication, database, storage, and APIs without building a custom backend.

---

### Options

- Firebase
- Supabase
- PocketBase
- Custom Express API

---

### Decision

Use **Supabase**.

---

### Rationale

Supabase offers:

- PostgreSQL
- Authentication
- Storage
- Realtime
- Edge Functions
- Row Level Security

This reduces implementation effort while maintaining flexibility.

---

### Trade-offs

Pros

- SQL database
- Open-source ecosystem
- Powerful security
- Excellent developer experience

Cons

- Vendor dependence
- Fewer managed services than some cloud providers

---

# ADR-004
## Database Selection

### Status

Accepted

---

### Problem

Marketplace data contains relationships between users, listings, images, offers, reviews, favorites, and reports.

---

### Options

- PostgreSQL
- MongoDB
- Firestore

---

### Decision

Use **PostgreSQL**.

---

### Rationale

Marketplace data is relational by nature.

PostgreSQL provides:

- ACID transactions
- Foreign keys
- Constraints
- Indexing
- Full-text search
- Mature tooling

---

### Trade-offs

Pros

- Strong consistency
- Excellent relational support
- Powerful querying

Cons

- More structured schema design
- Slightly higher learning curve than NoSQL

---

# ADR-005
## Authentication

### Status

Accepted

---

### Decision

Use **Supabase Authentication**.

---

### Rationale

Provides:

- Secure password hashing
- JWT sessions
- Email verification
- Password reset
- Session management

without custom implementation.

---

# ADR-006
## Authorization

### Status

Accepted

---

### Decision

Use **Row Level Security (RLS)** as the primary authorization mechanism.

---

### Rationale

Authorization rules remain close to the data.

Example:

Users can only update their own listings.

---

### Trade-offs

Pros

- Centralized security
- Reduced application logic
- Lower risk of accidental data exposure

Cons

- More complex SQL policies

---

# ADR-007
## UI Component Library

### Status

Accepted

---

### Options

- Material UI
- Chakra UI
- Ant Design
- shadcn/ui

---

### Decision

Use **shadcn/ui**.

---

### Rationale

Provides accessible, customizable components without imposing a visual style.

Allows the product to establish its own brand identity.

---

### Trade-offs

Pros

- Full customization
- Accessibility
- Modern design

Cons

- More implementation effort than opinionated libraries

---

# ADR-008
## Styling Framework

### Status

Accepted

---

### Decision

Use **Tailwind CSS**.

---

### Rationale

Supports rapid UI development while maintaining design consistency.

---

### Trade-offs

Pros

- Utility-first workflow
- Small production bundle
- Responsive design

Cons

- Long class names
- Requires discipline for consistency

---

# ADR-009
## AI Provider

### Status

Accepted

---

### Options

- Gemini
- OpenAI
- Claude

---

### Decision

Use **Google Gemini**.

---

### Rationale

The free tier is suitable for MVP development and supports text generation tasks required by the AI Listing Assistant.

---

### Trade-offs

Pros

- Cost-effective
- Strong text generation
- Easy API integration

Cons

- Dependency on external service
- Response latency varies

---

# ADR-010
## State Management

### Status

Accepted

---

### Decision

Use:

- Server Components for data fetching
- TanStack Query for client-side server state
- React Context for lightweight global UI state

---

### Rationale

Avoid introducing a large state management library unless complexity demands it.

---

# ADR-011
## Image Storage

### Status

Accepted

---

### Decision

Store images in **Supabase Storage**.

---

### Rationale

Benefits include:

- Integrated authentication
- CDN delivery
- Signed URLs
- Simplified permissions

---

# ADR-012
## Search Strategy

### Status

Accepted

---

### Decision

Use PostgreSQL search capabilities for the MVP.

---

### Rationale

Expected data volume does not justify introducing Elasticsearch or Meilisearch.

Future migration remains possible if search requirements grow.

---

# ADR-013
## Communication Strategy

### Status

Accepted

---

### Decision

Use external communication channels rather than building an in-app chat.

Supported channels:

- Telegram
- Phone call

---

### Rationale

This aligns with existing user behavior in Ethiopia and significantly reduces development effort.

---

### Trade-offs

Pros

- Faster MVP
- Familiar user experience
- No chat moderation

Cons

- Conversations occur outside the platform

---

# ADR-014
## Payments

### Status

Deferred

---

### Decision

Exclude payment processing from the MVP.

---

### Rationale

The challenge lists Telebirr and Chapa as optional enhancements.

Excluding payments reduces scope while preserving a clear integration path.

---

# ADR-015
## Identity Verification

### Status

Deferred

---

### Decision

Design verification as a modular service.

Initial trust indicators include:

- Email verified
- Phone verified
- Telegram linked

Future integration:

- Fayda digital identity verification

---

### Rationale

Keeps the MVP simple while enabling stronger trust features later.

---

# ADR-016
## Analytics

### Status

Accepted

---

### Decision

Track product and user events from day one.

Examples:

- Listing created
- Listing viewed
- Search performed
- Offer submitted
- Favorite added

---

### Rationale

Analytics support future product improvements and provide insights into user behavior.

---

# ADR-017
## Deployment

### Status

Accepted

---

### Decision

Deploy using:

- GitHub
- GitHub Actions
- Vercel
- Supabase

---

### Rationale

This stack provides continuous deployment with minimal operational overhead.

---

# ADR-018
## API Design

### Status

Accepted

---

### Decision

Adopt RESTful APIs with consistent resource naming and versioning.

Example:

```
/api/v1/listings
/api/v1/offers
/api/v1/users
```

---

### Rationale

Predictable APIs simplify frontend integration and future maintenance.

---

# ADR Summary

| ADR | Decision |
|------|----------|
| ADR-001 | Serverless Architecture |
| ADR-002 | Next.js App Router |
| ADR-003 | Supabase Backend |
| ADR-004 | PostgreSQL Database |
| ADR-005 | Supabase Authentication |
| ADR-006 | Row Level Security |
| ADR-007 | shadcn/ui Components |
| ADR-008 | Tailwind CSS |
| ADR-009 | Google Gemini |
| ADR-010 | TanStack Query + React Context |
| ADR-011 | Supabase Storage |
| ADR-012 | PostgreSQL Search |
| ADR-013 | Telegram & Phone Communication |
| ADR-014 | No Payments in MVP |
| ADR-015 | Modular Verification (Fayda-ready) |
| ADR-016 | Product Analytics |
| ADR-017 | Vercel Deployment |
| ADR-018 | RESTful API Design |

---

# Conclusion

These Architecture Decision Records capture the engineering rationale behind the marketplace.

They provide a historical record for future contributors, reduce repeated discussions, and ensure technical consistency as the project evolves.