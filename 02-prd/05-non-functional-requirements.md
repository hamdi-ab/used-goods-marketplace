# Product Requirements Document (PRD)
# 05 - Non-Functional Requirements

> **Version:** 1.0
> **Status:** Draft
> **Priority:** Critical
> **Owner:** Engineering Team

---

# 1. Introduction

This document defines the non-functional requirements (NFRs) for the marketplace.

Unlike functional requirements, which describe what the system should do, non-functional requirements define how well the system should perform.

These requirements ensure the application is fast, secure, scalable, accessible, and production-ready.

---

# 2. Requirement Categories

This document covers:

- Performance
- Scalability
- Availability
- Security
- Reliability
- Accessibility
- Usability
- Maintainability
- Compatibility
- Observability
- SEO

---

# 3. Performance Requirements

## NFR-PERF-001

The homepage shall load in under **2 seconds** on a standard broadband connection.

Priority

Critical

---

## NFR-PERF-002

Product search shall return results within **500 milliseconds** under normal load.

Priority

Critical

---

## NFR-PERF-003

Product images shall be lazy-loaded.

Priority

High

---

## NFR-PERF-004

Images shall be optimized using modern formats (WebP/AVIF where supported).

Priority

High

---

## NFR-PERF-005

The application shall achieve:

- Lighthouse Performance ≥95
- Accessibility ≥95
- Best Practices ≥95
- SEO ≥95

Priority

Critical

---

## NFR-PERF-006

All API responses should complete in under **1 second**, excluding AI requests.

---

# 4. Scalability Requirements

## NFR-SCALE-001

The system architecture shall support at least:

- 10,000 users
- 50,000 listings
- 500 concurrent users

without architectural changes.

---

## NFR-SCALE-002

Database tables shall support pagination.

---

## NFR-SCALE-003

Search queries shall use indexed columns.

---

## NFR-SCALE-004

Image storage shall be independent from application servers.

---

# 5. Availability Requirements

## NFR-AVAIL-001

Target uptime

99%

---

## NFR-AVAIL-002

Application crashes shall not expose user data.

---

## NFR-AVAIL-003

Graceful error pages shall be displayed for unexpected failures.

---

# 6. Security Requirements

## NFR-SEC-001

Passwords shall never be stored in plain text.

(Authentication handled by Supabase.)

---

## NFR-SEC-002

All traffic shall use HTTPS.

---

## NFR-SEC-003

All API endpoints shall validate user authentication.

---

## NFR-SEC-004

Role-based authorization shall protect restricted actions.

Roles

- Guest
- User
- Admin

---

## NFR-SEC-005

Users may only edit their own resources.

Examples

- Listings
- Profile
- Offers

---

## NFR-SEC-006

Uploaded images shall be validated.

Allowed

- JPG
- PNG
- WEBP

Rejected

- Executables
- Scripts
- Unsupported file types

---

## NFR-SEC-007

Database access shall be protected using Row Level Security (RLS).

---

## NFR-SEC-008

All user input shall be validated on both client and server.

---

## NFR-SEC-009

The application shall prevent common web vulnerabilities including:

- SQL Injection
- XSS
- CSRF
- Broken Access Control

---

# 7. Reliability Requirements

## NFR-REL-001

Unexpected failures shall not corrupt stored data.

---

## NFR-REL-002

Failed image uploads shall not create incomplete listings.

---

## NFR-REL-003

Transactions shall maintain database consistency.

---

# 8. Accessibility Requirements

## NFR-ACC-001

The platform shall be fully keyboard navigable.

---

## NFR-ACC-002

Interactive components shall have visible focus states.

---

## NFR-ACC-003

Images shall include descriptive alt text where appropriate.

---

## NFR-ACC-004

Forms shall include accessible labels and validation messages.

---

## NFR-ACC-005

Color combinations shall meet WCAG AA contrast guidelines.

---

## NFR-ACC-006

Screen readers shall correctly interpret semantic HTML elements.

---

# 9. Usability Requirements

## NFR-USE-001

Users shall be able to create a listing in under **60 seconds**.

---

## NFR-USE-002

Users shall locate a product in under **30 seconds**.

---

## NFR-USE-003

Primary actions shall be reachable within two interactions from the homepage.

---

## NFR-USE-004

Error messages shall clearly explain the issue and suggest corrective actions.

---

# 10. Maintainability Requirements

## NFR-MAIN-001

Frontend code shall use reusable UI components.

---

## NFR-MAIN-002

Business logic shall be separated from presentation logic.

---

## NFR-MAIN-003

API routes shall follow consistent naming conventions.

---

## NFR-MAIN-004

Database schema shall follow normalization principles where appropriate.

---

## NFR-MAIN-005

All code shall be documented and formatted consistently.

---

# 11. Compatibility Requirements

## NFR-COMP-001

The application shall support the latest two versions of:

- Chrome
- Edge
- Firefox
- Safari

---

## NFR-COMP-002

The application shall support:

- Desktop
- Tablet
- Mobile

---

## NFR-COMP-003

Responsive layouts shall function from **320px** to **1920px** screen widths.

---

# 12. Observability Requirements

## NFR-OBS-001

Critical application errors shall be logged.

---

## NFR-OBS-002

Authentication failures shall be recorded.

---

## NFR-OBS-003

Unhandled exceptions shall be traceable.

---

# 13. SEO Requirements

## NFR-SEO-001

Every public page shall include:

- Title
- Meta Description
- Open Graph Metadata

---

## NFR-SEO-002

Marketplace listings shall have SEO-friendly URLs.

Example

```
/listing/iphone-13-pro-256gb
```

---

## NFR-SEO-003

The application shall generate a sitemap.

---

## NFR-SEO-004

Robots.txt shall be configured correctly.

---

# 14. AI Requirements

## NFR-AI-001

AI-generated content shall always be editable.

---

## NFR-AI-002

AI responses should complete within **10 seconds**.

---

## NFR-AI-003

System failures in AI services shall not prevent manual listing creation.

---

# 15. Future Readiness

The architecture shall support future integration with:

- Fayda Identity Verification
- Telebirr
- Chapa
- Push Notifications
- Mobile Applications
- Delivery Services

without requiring major redesign.

---

# 16. Acceptance Checklist

| Category | Target |
|----------|--------|
| Performance | Lighthouse ≥95 |
| Accessibility | Lighthouse ≥95 |
| Security | RLS Enabled |
| Availability | 99% |
| Responsive Design | 320px–1920px |
| Search Response | <500ms |
| Listing Creation | <60 sec |
| Product Discovery | <30 sec |
| Browser Support | Latest 2 Versions |
| API Response | <1 sec (non-AI) |

---

# 17. Summary

These non-functional requirements ensure the marketplace is not only feature-complete but also reliable, performant, secure, and scalable.

Meeting these requirements demonstrates that the application is suitable for real-world deployment and aligns with the VinTech Challenge evaluation criteria for technical execution, user experience, and scalability.