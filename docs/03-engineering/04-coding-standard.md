# Coding Standards

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Language:** TypeScript
>
> **Framework:** Next.js 15 + React 19
>
> **Owner:** Engineering Team

# 1. Purpose

This document establishes coding conventions and best practices for the marketplace.

Objectives:
- Improve readability
- Reduce bugs
- Simplify maintenance
- Ensure consistency
- Enable effective collaboration

# 2. General Principles

All code should be:
- Readable
- Predictable
- Testable
- Reusable
- Secure
- Performant

Prioritize clarity over cleverness.

# 3. TypeScript Standards

Enable:
```json
"strict": true
```
Rules:
- Avoid `any`
- Prefer explicit types
- Use interfaces for object contracts
- Use type aliases for unions
- Narrow unknown values before use

Example:
```ts
interface Listing {
  id: string;
  title: string;
  price: number;
}
```
# 4. Naming Conventions

## Variables

Use `camelCase`.
```ts
listingTitle
sellerProfile
trustScore
```

## Constants

Use `UPPER_SNAKE_CASE`.
```ts
MAX_IMAGES
MAX_TITLE_LENGTH
DEFAULT_PAGE_SIZE
```

## Functions

Use verbs.
```ts
createListing()
calculateTrustScore()
uploadImages()
fetchListings()
```

## React Components

Use `PascalCase`.
```tsx
ListingCard
SellerProfile
OfferModal
SearchFilters
```

## Hooks

Prefix with `use`.
```ts
useAuth()
useListings()
useSearch()
```

## Files

Examples:
```text
listing-card.tsx
offer-modal.tsx
create-listing.ts
use-auth.ts
```
Use kebab-case for filenames.

# 5. Folder Organization

Group code by feature.

Example:
```text
features/

listings/
  components/
  hooks/
  services/
  schemas/
  types/
```
Avoid organizing primarily by file type at the root level.

# 6. React Standards

Prefer:
- Functional components
- Server Components by default
- Client Components only when needed

Keep components focused on a single responsibility.

# 7. Component Guidelines

A component should:
- Solve one problem
- Receive clear props
- Avoid hidden side effects
- Be reusable when appropriate

Avoid components exceeding ~200 lines without good reason.

# 8. Props

Prefer explicit interfaces.
```ts
interface ListingCardProps {
  listing: Listing;
  onFavorite: () => void;
}
```

Avoid passing large, unrelated objects.

# 9. State Management

Use the smallest scope possible.

Order of preference:
1. Local state
2. URL state
3. React Context
4. Server state (TanStack Query)

Do not place server data in Context.

# 10. Async Code

Always use `async/await`.

Avoid deeply nested promise chains.

Handle errors explicitly.
```ts
try {
  await createListing();
} catch (error) {
  handleError(error);
}
```

# 11. Error Handling

Never silently ignore errors.

Provide:
- User-friendly message
- Logged technical details
- Recovery path when possible

# 12. Logging

Development:
```ts
console.debug()
```
Production: Use centralized logging.

Never log:
- Passwords
- JWTs
- API secrets
- Personal information

# 13. Comments

Comments should explain **why**, not **what**.

Good:
```ts
// Prevent duplicate offers for the same listing.
```
Bad:
```ts
// Increment counter.
counter++;
```
Prefer expressive code over excessive comments.

# 14. Functions

Keep functions:
- Small
- Focused
- Pure when possible

Prefer early returns over deep nesting.

# 15. Validation

Validate all external input.

Use:
- Zod
- TypeScript types
- Server-side checks

Never trust client input.

# 16. API Standards

API handlers should:
- Validate input
- Authenticate user
- Authorize action
- Call service layer
- Return consistent responses

Business logic belongs in services, not route handlers.

# 17. Database Access

All database interactions go through repositories or data access services.

Avoid raw queries scattered throughout the application.

# 18. Styling Standards

Use:
- Tailwind CSS
- shadcn/ui components
- Design tokens

Avoid inline styles unless necessary.

# 19. Accessibility

Every interactive element should have:
- Visible focus state
- Accessible label
- Keyboard support

Use semantic HTML before ARIA.

# 20. Performance Guidelines

Avoid:
- Unnecessary re-renders
- Large client bundles
- Duplicate network requests

Prefer:
- Memoization only when measured
- Lazy loading
- Server rendering

Optimize based on profiling, not assumptions.

# 21. Security Practices

Never:
- Trust user input
- Expose secrets
- Bypass authorization
- Disable validation

Always:
- Escape user content
- Validate uploads
- Use parameterized queries

# 22. Imports

Order imports consistently:
1. External libraries
2. Internal shared modules
3. Feature modules
4. Relative imports

Remove unused imports before committing.

# 23. Formatting

Use:
- ESLint
- Prettier

Formatting is automated.

Do not manually fight the formatter.

# 24. Testing Expectations

Every new feature should include:
- Unit tests for business logic
- Integration tests when applicable
- Updated E2E tests for critical flows

# 25. Documentation

Public APIs, complex business rules, and architectural decisions should be documented.

Keep README and feature documentation current.

# 26. Code Review Checklist

Before requesting review:
- Code compiles
- Tests pass
- Lint passes
- No debug code
- No commented-out code
- No TODOs without issue references
- Documentation updated if needed

# 27. Anti-Patterns

Avoid:
- God components
- Massive utility files
- Circular dependencies
- Duplicate business logic
- Premature optimization
- Global mutable state

# 28. Future Evolution

As the codebase grows, standards should evolve through Architecture Decision Records (ADRs) rather than ad hoc exceptions.

# 29. Summary

These coding standards provide a shared engineering language for the project.

By emphasizing readability, consistency, strong typing, security, and maintainability, the team can deliver high-quality software while reducing long-term technical debt.
