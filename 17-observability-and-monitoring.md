# Observability & Monitoring Strategy

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Draft
>
> **Owner:** Engineering Team

---

# 1. Purpose

This document defines how the marketplace monitors application health, detects issues, measures business performance, and supports rapid troubleshooting.

Objectives:

- Detect failures early
- Improve reliability
- Measure product usage
- Support continuous improvement
- Reduce Mean Time To Resolution (MTTR)

---

# 2. Observability Pillars

The platform is built around three pillars:

```text
Logs

↓

Metrics

↓

Traces (Future)
```

Together, these provide visibility into system behavior.

---

# 3. Logging Strategy

## Logging Principles

Every log should answer:

- What happened?
- When did it happen?
- Who initiated it?
- Which component was involved?
- Was it successful?

Logs should be structured and machine-readable.

---

## Log Levels

| Level | Purpose |
|---------|---------|
| DEBUG | Development diagnostics |
| INFO | Normal application events |
| WARN | Recoverable issues |
| ERROR | Failed operations |
| FATAL | System-critical failures |

---

## Example

```json
{
  "level": "INFO",
  "event": "listing_created",
  "userId": "usr_123",
  "listingId": "lst_456",
  "timestamp": "2026-08-07T12:00:00Z"
}
```

---

# 4. Error Monitoring

Track all unexpected failures.

Examples:

- Failed login
- Image upload error
- Database timeout
- AI service failure
- Payment integration error (future)

Future Tool:

- Sentry

---

# 5. Performance Monitoring

Monitor:

- Page load time
- API response time
- Database query duration
- Search latency
- Image upload duration
- Largest Contentful Paint (LCP)
- Interaction to Next Paint (INP)

Compare against targets defined in the Performance Strategy.

---

# 6. Infrastructure Health

Monitor:

- Vercel deployment status
- Supabase availability
- Storage usage
- Database connections
- Function execution errors

---

# 7. Business Metrics

The platform should measure:

## Marketplace

- Listings created
- Listings sold (future)
- Active sellers
- Active buyers
- Searches performed
- Favorites added
- Offers submitted

---

## Trust

- Verified sellers
- Reports submitted
- Reports resolved
- Average seller rating

---

## Engagement

- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Monthly Active Users (MAU)
- Session duration
- Return visitor rate

---

# 8. AI Metrics

For AI Listing Assistant:

Track:

- Number of generations
- Average response time
- Failure rate
- Suggested category acceptance
- Suggested title acceptance

These metrics help evaluate AI usefulness.

---

# 9. Security Monitoring

Watch for:

- Repeated failed logins
- Rate limit violations
- Suspicious upload attempts
- Unauthorized API access
- Excessive report submissions

Future:

- Automated anomaly detection

---

# 10. User Experience Metrics

Measure:

- Bounce rate
- Time to first interaction
- Search success rate
- Listing creation completion rate
- Offer completion rate

These indicate usability issues.

---

# 11. Alerting Strategy

Critical alerts include:

- Database unavailable
- Authentication failures
- Deployment failure
- Storage unavailable
- API error rate exceeds threshold

Alerts should notify the development team immediately.

---

# 12. Dashboards

## Engineering Dashboard

Displays:

- System uptime
- API latency
- Error count
- Deployment status
- Storage usage

---

## Product Dashboard

Displays:

- New users
- Listings created
- Search volume
- Favorite activity
- Offer volume

---

## Trust Dashboard

Displays:

- Reports
- Verification requests
- Seller ratings
- Moderation actions

---

# 13. Incident Tracking

Each production incident should record:

- Time detected
- Severity
- Root cause
- Resolution
- Preventive action

This builds an internal knowledge base.

---

# 14. Privacy

Monitoring must never expose:

- Passwords
- Authentication tokens
- Personal messages
- Sensitive identification data

Logs should use anonymized identifiers where possible.

---

# 15. Data Retention

Suggested retention:

| Data | Retention |
|--------|----------:|
| Application Logs | 30 days |
| Error Reports | 90 days |
| Performance Metrics | 90 days |
| Business Analytics | 12 months |

Retention periods may change based on operational needs.

---

# 16. Future Tooling

Potential tools:

| Area | Tool |
|------|------|
| Error Tracking | Sentry |
| Product Analytics | PostHog |
| Performance | Vercel Analytics |
| Database | Supabase Dashboard |
| Logging | OpenTelemetry-compatible platform |
| Dashboards | Grafana (future) |

The MVP can rely primarily on Vercel and Supabase dashboards.

---

# 17. Success Indicators

The platform is considered healthy when:

- Uptime ≥ 99%
- API response < 300 ms (average)
- Error rate < 1%
- Failed uploads < 0.5%
- Successful listing creation > 95%

---

# 18. Continuous Improvement

Monitoring data should be reviewed regularly to:

- Prioritize bug fixes
- Improve performance
- Optimize user flows
- Identify abandoned features
- Validate product decisions

---

# 19. Summary

Observability transforms the marketplace from a deployed application into an operable product.

By combining structured logging, performance monitoring, business analytics, and proactive alerting, the team gains the visibility needed to maintain reliability, improve user experience, and support future growth.