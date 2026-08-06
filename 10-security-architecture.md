# Security Architecture

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Draft
>
> **Owner:** Security & Backend Team

---

# 1. Purpose

This document defines the security architecture for the Used Goods Marketplace.

It covers:

- Authentication
- Authorization
- Data protection
- File upload security
- API security
- Privacy
- Threat mitigation
- Audit logging
- Security monitoring

The objective is to build a secure marketplace while maintaining a smooth user experience.

---

# 2. Security Principles

The platform follows these core principles:

- Least Privilege
- Defense in Depth
- Secure by Default
- Zero Trust
- Privacy by Design
- Fail Securely

---

# 3. Threat Model

## Assets to Protect

- User accounts
- Seller profiles
- Listings
- Images
- Offers
- Reviews
- Personal information
- Authentication tokens

---

## Potential Threats

- Account takeover
- Fake listings
- Spam
- Fraudulent sellers
- XSS
- CSRF
- SQL Injection
- File upload attacks
- API abuse
- Brute force attacks
- Data leakage

---

# 4. Authentication

Authentication is handled by:

- Supabase Authentication

Supported methods:

- Email & Password

Future:

- Google OAuth
- Fayda Identity
- Passkeys

---

## Password Policy

Minimum:

- 8 characters

Recommended:

- Uppercase
- Lowercase
- Number
- Special character

Passwords are never stored by the application.

---

# 5. Session Management

Sessions use JWT tokens.

Rules:

- HTTPS only
- Short-lived access tokens
- Secure refresh flow
- Automatic expiration
- Logout invalidates local session

---

# 6. Authorization

Authorization follows Role-Based Access Control (RBAC).

Roles:

- Guest
- User
- Seller
- Admin

Examples:

Guest:

- Browse listings

User:

- Favorite listings
- Submit offers

Seller:

- Create listings
- Manage listings

Admin:

- Moderate reports
- Suspend users

---

# 7. Ownership Validation

Before modifying resources, ownership must be verified.

Example:

```
User owns Listing?

YES → Continue

NO → 403 Forbidden
```

Ownership checks exist in:

- Server logic
- Supabase RLS

---

# 8. Row Level Security (RLS)

Every table enforces RLS.

Examples:

Profiles

Users may edit only their own profile.

Listings

Only owners may update listings.

Offers

Buyers see their offers.

Sellers see offers on their listings.

Notifications

Users access only their own notifications.

---

# 9. API Security

All APIs require:

- HTTPS
- JWT Authentication (where applicable)
- Input validation
- Output sanitization
- Rate limiting
- Consistent error handling

Sensitive endpoints require authentication.

---

# 10. Input Validation

Validation occurs in two stages.

Client-side:

- React Hook Form
- Zod

Server-side:

- Zod validation
- Business rule validation

Never trust client validation alone.

---

# 11. File Upload Security

Accepted formats:

- JPG
- JPEG
- PNG
- WebP

Maximum size:

- 5 MB per image

Maximum uploads:

- 10 images per listing

Validation:

- MIME type
- File size
- Image decoding
- Reject executable content

Store files outside the public source code.

---

# 12. Image Processing

Upload Flow:

```text
Client Upload

↓

Validate

↓

Compress

↓

Virus Scan (Future)

↓

Store

↓

Generate Public URL
```

Future:

- AI-based inappropriate content detection
- Duplicate image detection

---

# 13. XSS Protection

Prevent Cross-Site Scripting by:

- Escaping user-generated content
- Sanitizing HTML (if supported)
- Never rendering raw HTML without sanitization
- Using React's default escaping

---

# 14. CSRF Protection

Mitigations:

- SameSite cookies (if used)
- CSRF tokens for state-changing requests (if cookie auth is introduced)
- JWT Authorization headers
- Origin validation

---

# 15. SQL Injection Protection

Protection:

- Parameterized queries
- Supabase client libraries
- No string concatenation in SQL

---

# 16. Rate Limiting

Anonymous users:

- 100 requests/hour

Authenticated users:

- 1000 requests/hour

AI endpoints:

- 20 generations/day/user

Report endpoint:

- Prevent repeated submissions within a short time window

---

# 17. Abuse Prevention

Detect:

- Repeated failed logins
- Mass listing creation
- Duplicate reports
- Excessive AI requests
- Suspicious contact activity

Future:

- CAPTCHA after repeated abuse
- Automated moderation

---

# 18. Privacy

Collect only necessary data.

Required:

- Email
- Name
- City

Optional:

- Phone
- Telegram username

Sensitive information must not be exposed publicly without user consent.

---

# 19. Personal Data Protection

Public profile:

- Display name
- Avatar
- City
- Trust indicators

Private profile:

- Email
- Internal identifiers
- Verification records (unless surfaced as badges)

---

# 20. Secrets Management

Secrets stored in environment variables.

Examples:

```
SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY

GEMINI_API_KEY
```

Rules:

- Never commit secrets to Git
- Never expose service role keys to the client

---

# 21. Security Headers

Configure:

- Content-Security-Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Strict-Transport-Security (HSTS)

---

# 22. Audit Logging

Log:

- Login attempts
- Listing creation
- Listing edits
- Offer actions
- Verification changes
- Admin actions
- Report resolution

Do not log:

- Passwords
- JWT tokens
- Sensitive personal data

---

# 23. Monitoring

Track:

- Failed authentication attempts
- API error rates
- Storage upload failures
- AI service failures
- Rate limit violations

Future:

- Sentry
- PostHog
- Security alerts

---

# 24. Backup & Recovery

Database:

- Managed Supabase backups

Storage:

- Versioning (future)

Recovery objectives:

- Restore critical data quickly
- Preserve audit history

---

# 25. Security Testing

Perform:

- Authentication tests
- Authorization tests
- File upload tests
- RLS policy tests
- Input validation tests
- Rate limiting tests
- Penetration testing (basic)

---

# 26. Incident Response

In case of a security incident:

1. Detect
2. Contain
3. Investigate
4. Recover
5. Review
6. Improve controls

Maintain a record of significant incidents for future learning.

---

# 27. Future Enhancements

Planned improvements:

- Fayda verification
- Device/session management
- Multi-factor authentication (MFA)
- AI-assisted fraud detection
- Automated spam detection
- Image moderation
- Security dashboard

---

# 28. Summary

The marketplace adopts a layered security architecture that protects users, data, and platform integrity without compromising usability.

By combining secure authentication, Row Level Security, strong validation, controlled file uploads, audit logging, and privacy-first design, the platform establishes trust as a core feature while remaining practical for a zero-cost MVP.