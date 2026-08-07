# CI/CD & DevOps Strategy

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Draft
>
> **Owner:** Engineering Team

# 1. Purpose

This document defines the Continuous Integration (CI), Continuous Deployment (CD), and DevOps practices for the Used Goods Marketplace.

Objectives:
- Automate quality checks
- Prevent broken deployments
- Ensure consistent environments
- Enable rapid iteration
- Minimize manual deployment steps

# 2. DevOps Principles

The project follows these principles:
- Automate repetitive tasks
- Deploy small, incremental changes
- Keep production deployable at all times
- Fail fast through automated validation
- Monitor production health

# 3. Technology Stack

| Area | Technology |
|--------|------------|
| Source Control | GitHub |
| CI | GitHub Actions |
| Deployment | Vercel |
| Database | Supabase |
| Storage | Supabase Storage |
| Secrets | GitHub Secrets + Vercel Environment Variables |

# 4. Environments

Three environments are defined.

## Development

Purpose: Daily development.

Characteristics:
- Local machine
- Local `.env.local`
- Development database

## Preview

Purpose: Review Pull Requests.

Characteristics:
- Automatically created by Vercel
- Isolated deployment
- Connected to preview environment variables

## Production

Purpose: Public application.

Characteristics:
- Stable
- Protected
- Uses production Supabase project

# 5. Deployment Pipeline
```text
Developer

↓

Feature Branch

↓

Push to GitHub

↓

GitHub Actions

↓

Lint

↓

Type Check

↓

Unit Tests

↓

Build

↓

Preview Deployment

↓

Pull Request Review

↓

Merge to main

↓

Production Deployment
```

# 6. Continuous Integration

Every Pull Request automatically runs:
- Install dependencies
- TypeScript compilation
- ESLint
- Prettier validation
- Unit tests
- Build verification

If any step fails, the PR cannot be merged.

# 7. Continuous Deployment

Merging into `main` automatically triggers:
1. Production build
2. Deployment to Vercel
3. Health check
4. Deployment notification

No manual deployment is required.

# 8. GitHub Actions Workflow

## Workflow 1 – Pull Request Validation

Trigger:
```text
pull_request
```
Steps:
- Checkout repository
- Install dependencies
- Cache packages
- Run lint
- Run type check
- Run tests
- Build project

## Workflow 2 – Production Deployment

Trigger:
```text
push → main
```
Steps:
- Validate build
- Deploy to Vercel
- Verify deployment status

# 9. Environment Variables

Local:
```text
.env.local
```
Production: Managed through Vercel.

Examples:
```text
NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

GEMINI_API_KEY
```
Secrets must never be committed to Git.

# 10. Dependency Management

Package manager:
```
pnpm
```
Benefits:
- Faster installs
- Efficient disk usage
- Lockfile consistency

Dependencies are updated regularly and reviewed before adoption.

# 11. Build Process

Production build includes:
- TypeScript compilation
- Next.js optimization
- Tree shaking
- Static asset optimization
- Image optimization

The build must complete without warnings related to critical functionality.

# 12. Rollback Strategy

If a deployment introduces a critical issue:
1. Revert the offending commit
2. Redeploy automatically
3. Investigate root cause
4. Add regression test

Vercel deployment history enables quick recovery.

# 13. Database Migrations

Database schema changes are version-controlled.

Example:
```text
supabase/migrations/

20260807_create_profiles.sql

20260807_create_listings.sql
```
Rules:
- Never edit an existing migration.
- Always create a new migration.

# 14. Code Quality Gates

A Pull Request cannot be merged if:
- Lint fails
- TypeScript fails
- Tests fail
- Build fails

# 15. Secrets Management

Sensitive values include:
- API keys
- Service role keys
- OAuth secrets

Rules:
- Store only in environment variables
- Rotate compromised keys immediately
- Never expose secrets in client-side code

# 16. Release Strategy

Release model:
- Continuous Delivery

Every successful merge to `main` is deployable.

Future:
- Semantic versioning
- Release notes
- Tagged releases

# 17. Infrastructure

Current infrastructure:
```text
GitHub

↓

GitHub Actions

↓

Vercel

↓

Supabase
```
Future additions:
- Redis
- Queue workers
- Dedicated search engine
- CDN optimization

# 18. Health Checks

Verify after deployment:
- Home page loads
- API responds
- Authentication works
- Database reachable
- Image storage accessible

# 19. Backup Strategy

Database: Managed backups via Supabase.

Source Code: GitHub repository.

Documentation: Markdown repository.

Future: Automated database export schedule.

# 20. Future Improvements

Potential enhancements:
- Preview database cloning
- Automated dependency updates
- Performance regression checks
- Lighthouse CI
- Security scanning
- Containerized deployments

# 21. Summary

The CI/CD and DevOps strategy provides a reliable and automated workflow from code commit to production deployment.

By integrating GitHub Actions, Vercel, and Supabase, the team can focus on delivering features while maintaining high quality, fast feedback, and deployment confidence.
