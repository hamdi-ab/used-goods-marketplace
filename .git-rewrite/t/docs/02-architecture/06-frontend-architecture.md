# Frontend Architecture

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Draft
>
> **Framework:** Next.js 15
>
> **Language:** TypeScript
>
> **Architecture:** Feature-First + App Router
>
> **Owner:** Frontend Team

# 1. Purpose

This document defines the frontend architecture of the marketplace.

It describes:

- Project structure
- Component organization
- Routing
- State management
- Data fetching
- Performance strategy
- Accessibility
- SEO
- UI architecture

The objective is to build a frontend that is scalable, maintainable, and optimized for both users and developers.

# 2. Frontend Principles

The frontend follows these principles:

- Feature-first organization
- Server-first rendering
- Client-side interactivity only where necessary
- Reusable UI components
- Strong typing
- Accessibility by default
- Mobile-first responsive design

# 3. High-Level Architecture

```text
                Browser

                    │

              Next.js App Router

                    │

      Server Components (Default)

                    │

      Client Components (Interactive)

                    │

          API / Server Actions

                    │

               Supabase Backend
```

# 4. Project Structure

```text
src/

├── app/
│
├── features/
│
├── shared/
│
├── components/
│
├── lib/
│
├── hooks/
│
├── providers/
│
├── styles/
│
├── types/
│
└── config/
```

# 5. App Router Structure

```text
app/

(layout)

page.tsx

search/

category/

listing/

seller/

dashboard/

favorites/

profile/

login/

register/

admin/

api/
```

Every route owns:

- Page
- Metadata
- Loading UI
- Error UI

# 6. Feature Organization

Each feature contains everything related to that domain.

Example:

```text
features/

listings/

    api/

    components/

    hooks/

    schemas/

    services/

    types/

    utils/

offers/

favorites/

search/

reviews/

notifications/

profile/

ai/
```

Benefits:

- Easier maintenance
- Better code ownership
- Reduced coupling

# 7. Shared Folder

Shared code is reused across multiple features.

```text
shared/

components/

layouts/

icons/

ui/

utils/

constants/

types/
```

Only reusable code belongs here.

# 8. Component Hierarchy

```text
Page

↓

Feature Components

↓

Shared Components

↓

Primitive UI Components
```

Example

```text
Listing Page

↓

ListingDetails

↓

ImageGallery

↓

Button
```

# 9. Server Components

Default choice.

Use for:

- Product pages
- Seller pages
- Category pages
- Search results
- Dashboard summaries

Benefits:

- Better SEO
- Smaller JavaScript bundle
- Faster initial load

# 10. Client Components

Only used when interactivity is required.

Examples:

- Forms
- Favorites
- Filters
- Offer modal
- Image carousel
- Theme switcher

# 11. State Management

## Local State

Use React state.

Examples:

- Input fields
- Modals
- Tabs
- Dropdowns

## Server State

Use TanStack Query.

Examples:

- Listings
- Offers
- Reviews
- Notifications

## Global UI State

Use React Context.

Examples:

- Auth session
- Theme
- Mobile navigation
- Toast notifications

Avoid using Context for frequently changing server data.

# 12. Data Fetching Strategy

### Server Components

Used for:

- Initial page data
- SEO content
- Public listings

### Client Components

Used for:

- Infinite scrolling
- Real-time updates
- User interactions

### Mutations

Performed through:

- Server Actions
- API Routes (when appropriate)

# 13. Forms

Use:

- React Hook Form
- Zod

Validation flow:

```text
Input

↓

Zod Validation

↓

Submit

↓

Server Validation

↓

Database
```

# 14. Styling Strategy

**Framework:** Tailwind CSS

**Component Library:** shadcn/ui

**Icons:** Lucide React

**Animations:** Framer Motion (only where meaningful)

Avoid excessive animations.

# 15. Design Tokens

Centralize:

- Colors
- Typography
- Border radius
- Shadows
- Spacing
- Breakpoints

Never hardcode design values in components.

# 16. Performance Strategy

### Images

- Next.js Image
- Lazy loading
- Responsive sizes
- Compression

### Code Splitting

Lazy-load:

- Dashboard charts
- AI components
- Admin pages

### Rendering

Prefer:

**Server Components:** Avoid unnecessary hydration.

### Bundle Optimization

- Tree shaking
- Dynamic imports
- Minimal client JavaScript

# 17. Accessibility

Minimum standard:

**WCAG AA:** Requirements:

- Keyboard navigation
- Focus indicators
- ARIA labels
- Semantic HTML
- Screen reader support
- Color contrast compliance

# 18. SEO Strategy

Every public page includes:

- Title
- Description
- Open Graph
- Twitter Card
- Canonical URL
- Structured Data (JSON-LD)

Listings should expose product metadata for search engines.

# 19. Error Handling

Each route provides:

```text
loading.tsx

error.tsx

not-found.tsx
```

Users receive clear recovery actions.

# 20. Loading Experience

Use skeleton loaders instead of generic spinners where possible.

Examples:

- Listing cards
- Product details
- Dashboard widgets

Progressive loading improves perceived performance.

# 21. Authentication Flow

```text
Login

↓

JWT Session

↓

Protected Route

↓

Dashboard
```

Route guards:

- Guest
- Buyer
- Seller
- Admin

# 22. Realtime Features

Supabase Realtime powers:

- Notifications
- Offer updates
- Dashboard refreshes (future)

Realtime should enhance—not block—the user experience.

# 23. Testing

**Unit Tests:** Components, Hooks, Utilities

**Integration Tests:** Feature workflows

**End-to-End Tests:** Registration, Listing creation, Offer flow, Search journey

# 24. Coding Standards

- TypeScript strict mode
- ESLint
- Prettier
- Absolute imports
- No `any` unless justified
- Small, focused components
- One responsibility per hook

# 25. Future Evolution

The architecture supports:

- Progressive Web App (PWA)
- Native mobile clients
- White-label themes
- Offline caching
- Internationalization (i18n)
- Dark mode
- Advanced analytics

without major restructuring.

# 26. Summary

The frontend architecture follows a modern, server-first approach using Next.js App Router and a feature-first folder structure.

By emphasizing reusable components, strong typing, performance optimization, and accessibility, the application remains maintainable as the marketplace grows while delivering an excellent user experience from day one.