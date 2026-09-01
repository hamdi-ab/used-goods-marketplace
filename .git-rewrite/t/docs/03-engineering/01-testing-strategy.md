# Testing Strategy

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.1
>
> **Status:** Draft
>
> **Owner:** Engineering Team

# 1. Purpose

This document defines the testing strategy for the Used Goods Marketplace.

The goal is to ensure the platform is:
- Reliable
- Secure
- Stable
- Maintainable

while enabling rapid feature development.

# 2. Testing Philosophy

We follow the **Testing Pyramid**.
```text
                E2E Tests
             ----------------
           Integration Tests
        ------------------------
              Unit Tests
```

The majority of tests should be unit tests because they are:
- Fast
- Cheap
- Reliable

End-to-end tests should focus only on critical user journeys.

# 3. Testing Levels

## Unit Testing

Purpose: Verify individual functions, utilities, and business logic.

Examples:
- Price formatting
- Trust score calculation
- Validation helpers
- Search ranking logic
- AI response parser

Tools:
- Vitest
- React Testing Library
- @vitest/coverage-v8

### Unit Testing Setup (web/)

| Concern | Convention |
|---------|------------|
| Runner | `vitest.config.mts`, `environment: node`, `globals: true` |
| Scripts | `npm test` (run), `npm run test:watch`, `npm run test:ci` (run + coverage) |
| Stubs | `vitest/stubs/server-only.ts`, `vitest/stubs/supabase-server.ts` — alias `server-only` and `@/lib/supabase/server` so pure seam modules load under Node without the Next server graph |
| Imports | Use `@/lib/...` aliases in tests, not `../lib/...` — relative specifiers resolve incorrectly under the Node env on Windows |
| Coverage | `npm run test:ci` emits `coverage/` (gitignored) via the v8 provider |

Pure seam surfaces covered: `lib/listings/constants` (`isValidUuid`, `formatPrice`, `formatCondition`, `LISTING_STATUS_LABELS`/`LISTING_STATUS_COLORS`), `lib/media` (`detectImageMime`, `uploadObjects` validation gate), `lib/browse` (`parseBrowseParams` window clamp, `buildBrowseUrl`), `lib/search` (`parseSearchParams` filter validation, `buildSearchUrl`), `lib/pagination` (`parseOffset` window clamp, `nextOffset`), `lib/favorites/constants` (`toggleFavoriteState`, `buildLoginUrl`), `lib/offers/constants` (`OFFER_STATUSES` status machine, `OFFER_AMOUNT_MAX`/`OFFER_MESSAGE_MAX` bounds, `buildLoginUrl`), `lib/reviews/constants` (`RATING_MIN`/`RATING_MAX`, `REVIEW_COMMENT_MAX`, `REVIEWABLE_OFFER_STATUS`, `ratingAverageToTrustScore`), `lib/verifications/constants` (`sellerVerificationBadges`, `hasVerification`, `VERIFICATION_BADGE_LABELS`).

## Integration Testing

Purpose: Verify interaction between multiple components or services.

Examples:
- Create Listing → Database
- Login → Profile Loading
- Offer Submission → Notification
- Image Upload → Storage

### Integration Testing Setup (web/, live Supabase stack)

Runs against the **running local Supabase stack** (not mocks), so it catches the
query-shape and RLS class of bugs the mocked unit suite cannot see — e.g. the
dashboard count that passed unit tests but failed against real PostgREST.

| Concern | Convention |
|---------|------------|
| Runner | `vitest.integration.config.mts`, `environment: node`; aliases `server-only` and `@/lib/supabase/server` to stubs so `@/lib/...` seam modules load, but tests pass a real client so the stub `createClient` is never called |
| Script | `npm run test:integration` |
| Skip gate | `integrationAvailable` (top-level-await probe of `${SUPABASE_URL}/rest/v1/`) — each suite is `describe.skipIf(!integrationAvailable)` so a down stack skips, never fails |
| Auth | `signInAs(email, password)` returns `{ client, userId }` with a real signed-in browser client; `anonClient()` for anon role |
| Creds | `SEED` const mirrors `web/supabase/seed.sql` accounts (`demo1234`); seed user ids are deterministic UUIDs |

Suites:
- `tests/integration/query-shapes.test.ts` — relationship-filter regression
  (embedded `listing:` shape succeeds, non-embedded relationship filter is
  rejected) and the real `countIncomingOffers` contract.
- `tests/integration/rls.test.ts` — the §8 matrix: offers (anon denied,
  buyer-only own, seller-only owned listings, cross-seller isolation), profiles
  (public read, owner-only update), listings (anon reads published, buyer cannot
  update foreign).

## End-to-End Testing

Purpose: Simulate complete user journeys.

### End-to-End Testing Setup (web/, Playwright)

| Concern | Convention |
|---------|------------|
| Runner | `playwright.config.ts`; `testDir: tests/e2e`; `channel: "chrome"` (system Chrome, no browser download); `baseURL: http://localhost:3000` |
| Server | `webServer` runs `npm run dev` with `reuseExistingServer: true` — reuse a dev server you already have running |
| Script | `npm run test:e2e` |
| Host | Use `localhost`, never `127.0.0.1` — Next 16 dev rejects `127.0.0.1` origins (chunk 403, no hydration) |
| Timeouts | Dev-mode first compile of a route is slow (~6s); give URL/visibility assertions a generous timeout (e.g. 30s) |
| Locators | Exact-match form fields (`getByLabel("Password", { exact: true })` — the show/hide toggle's `aria-label` also contains "Password"); scope the avatar to `[data-slot="dropdown-menu-trigger"]` (the Next.js dev-tools button also has `aria-haspopup="menu"`) |

Critical flows:
- User registration
- Login
- Create listing
- Search listing
- Favorite listing
- Submit offer
- Report listing

Covered by smoke suite `tests/e2e/auth.spec.ts`: login → header menu → sign out
round-trip (the client-state regression that shipped — asserts the UI flips to
logged-out with no page reload) and the password visibility toggle.

# 4. Test Coverage Goals

| Layer | Target Coverage |
|---------|----------------|
| Utilities | 95% |
| Business Logic | 90% |
| Components | 80% |
| API Routes | 80% |
| Overall | ≥ 85% |

Coverage is a guide—not a substitute for meaningful tests.

# 5. Functional Testing

Validate that all user-facing features work as expected.

Examples:
- Register account
- Log in
- Edit profile
- Create listing
- Upload images
- Search products
- Apply filters
- Favorite listing
- Submit offer
- Leave review
- Report listing

# 6. Validation Testing

Verify input rules.

Examples:
Listing:
- Empty title
- Invalid price
- Too many images
- Missing category

Registration:
- Invalid email
- Weak password
- Duplicate email

Offer:
- Negative amount
- Offer on own listing

# 7. Authorization Testing

Ensure permissions are enforced.

Scenarios:
- Seller edits own listing ✅
- Seller edits another user's listing ❌
- Buyer views own offers ✅
- Buyer views another buyer's offers ❌
- Admin moderates reports ✅

# 8. Row Level Security Testing

Every RLS policy should have tests.

Examples: Profiles

- Read public profile
- Update own profile
- Update another user's profile

Listings

- Read published listings
- Update owned listing
- Update foreign listing

Offers

- Buyer reads own offers
- Seller reads offers for owned listings
- Unauthorized access denied

# 9. API Testing

Verify:
- HTTP status codes
- Request validation
- Response format
- Error handling
- Authentication
- Rate limiting

Example:
```http
POST /api/v1/listings
```
Expected:
- `201 Created`
- Valid JSON response
- Listing persisted

# 10. UI Testing

Verify:
- Responsive layouts
- Navigation
- Forms
- Loading states
- Error states
- Empty states
- Dark mode (future)

# 11. Accessibility Testing

Minimum standard: WCAG AA

Verify:
- Keyboard navigation
- Focus order
- Screen reader labels
- Color contrast
- Touch target size

# 12. Performance Testing

Measure:
- Page load time
- API response time
- Search latency
- Image upload speed

Targets follow the **Performance & Scalability Strategy**.

# 13. Security Testing

Verify:
- Authentication
- Authorization
- RLS policies
- File upload restrictions
- Input validation
- XSS prevention
- SQL injection protection
- Rate limiting

# 14. AI Feature Testing

Test the AI Listing Assistant with:
- Single image
- Multiple images
- Poor-quality image
- Empty description
- Long description

Verify:
- Generated title
- Suggested category
- Condition estimate
- Quality score

AI outputs should be reviewed for reasonableness, not exact wording.

# 15. Browser Testing

Supported browsers:
- Chrome
- Edge
- Firefox
- Safari (latest versions)

Mobile browsers:
- Chrome (Android)
- Safari (iOS)

# 16. Device Testing

Minimum breakpoints:
| Device | Width |
|---------|------:|
| Mobile | 360px |
| Tablet | 768px |
| Laptop | 1024px |
| Desktop | 1440px |

# 17. Regression Testing

Run regression tests before:
- New release
- Major refactor
- Database migration

Critical regression suite:
- Authentication
- Listings
- Search
- Offers
- Reviews

# 18. Test Data Strategy

Use seeded development data.

Include:
- Multiple sellers
- Multiple categories
- Listings with different conditions
- Reports
- Reviews

Avoid using real user data.

# 19. Continuous Testing

Tests should run automatically:
- On every pull request
- Before merging to `main`
- Before deployment

A failing test blocks the merge until resolved.

# 20. Defect Management

Bug severity:
| Level | Description |
|--------|-------------|
| Critical | Data loss, security, system unavailable |
| High | Core feature broken |
| Medium | Feature works with limitations |
| Low | Cosmetic or minor usability issue |

# 21. Exit Criteria

A feature is considered test-ready when:
- Unit tests pass
- Integration tests pass
- Critical E2E flow passes
- No Critical or High severity defects remain
- Accessibility checks pass
- Security review completed

# 22. Future Enhancements

Future additions:
- Visual regression testing
- Load testing
- Chaos testing
- AI-assisted test generation
- Contract testing for APIs

# 23. Summary

The testing strategy combines unit, integration, and end-to-end testing to provide confidence in the marketplace's functionality, security, and performance.

By automating quality checks and focusing on critical user journeys, the platform remains reliable while supporting rapid iteration during and after the VinTech Challenge.
