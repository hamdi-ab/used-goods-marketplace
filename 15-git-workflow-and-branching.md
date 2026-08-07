# Git Workflow & Branching Strategy

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Draft
>
> **Owner:** Engineering Team

# 1. Purpose

This document defines the Git workflow, branching strategy, commit conventions, and code review process for the marketplace.

Objectives:
- Maintain a clean Git history
- Reduce merge conflicts
- Enable rapid collaboration
- Support continuous deployment
- Simplify debugging and rollback

# 2. Workflow Philosophy

The project follows **Trunk-Based Development**.

Principles:
- Small, focused branches
- Frequent merges
- Short-lived feature branches
- Always keep `main` deployable
- Prefer many small Pull Requests over large ones

# 3. Branch Structure
```text
main
│
├── feature/authentication
├── feature/create-listing
├── feature/search
├── feature/offers
├── feature/reviews
├── feature/notifications
├── bugfix/image-upload
├── hotfix/login-error
└── chore/dependency-update
```

# 4. Protected Branch

## main

Rules:
- Protected branch
- No direct commits
- Merge only through Pull Requests
- Must pass all CI checks

The `main` branch should always be deployable.

# 5. Branch Naming

Feature
```text
feature/<feature-name>
```

Examples:
```text
feature/auth
feature/listings
feature/search
feature/profile
```
Bug Fix
```text
bugfix/<issue>
```

Examples:
```text
bugfix/image-upload
bugfix/favorites
```
Hot Fix
```text
hotfix/<issue>
```

Example:
```text
hotfix/login-loop
```
Chore
```text
chore/<task>
```

Examples:
```text
chore/update-eslint
chore/dependencies
```
Documentation
```text
docs/<topic>
```

Examples:
```text
docs/api
docs/database
```
# 6. Branch Lifecycle
```text
main

↓

Create Feature Branch

↓

Develop

↓

Commit

↓

Push

↓

Pull Request

↓

Code Review

↓

CI Passes

↓

Merge

↓

Delete Branch
```

# 7. Commit Message Convention

Use **Conventional Commits**.

Format:
```text
type(scope): short description
```
Examples

Feature:
```text
feat(listings): add listing creation endpoint
```
Bug Fix:
```text
fix(search): resolve category filter issue
```
Documentation:
```text
docs(api): update authentication examples
```
Refactor:
```text
refactor(profile): simplify avatar upload flow
```
Style:
```text
style(ui): align button spacing
```
Tests:
```text
test(offers): add offer service unit tests
```
Chore:
```text
chore(ci): enable preview deployments
```
# 8. Pull Request Process

Every feature is merged through a Pull Request.

A Pull Request should:
- Solve one problem
- Include a clear description
- Reference related issues (if any)
- Pass all automated checks

# 9. Pull Request Template

## Summary

Describe the purpose of this change.

## Changes

List the major modifications.

## Testing

Explain how the feature was tested.

## Screenshots

Attach UI screenshots when applicable.

## Checklist

- [ ] Code compiles
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No secrets committed
- [ ] Self-review completed

# 10. Code Review Guidelines

Reviewers should evaluate:
- Correctness
- Readability
- Simplicity
- Performance
- Security
- Accessibility (UI)
- Consistency with project architecture

Review comments should be constructive and specific.

# 11. Merge Strategy

Preferred: **Squash and Merge**

Benefits:
- Clean history
- One commit per feature
- Easier rollback

# 12. Release Tags

Future production releases may use Semantic Versioning.

Examples:
```text
v1.0.0
v1.1.0
v1.1.1
```
Meaning:
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

# 13. Hotfix Workflow

Critical production issue:
```text
main

↓

hotfix branch

↓

Fix

↓

PR

↓

CI

↓

Merge

↓

Deploy
```
Hotfixes receive priority over feature development.

# 14. Conflict Resolution

When merge conflicts occur:
1. Rebase or merge latest `main`
2. Resolve conflicts locally
3. Run tests
4. Push updated branch
5. Request final review

Avoid force-pushing shared branches unless coordinated with the team.

# 15. Repository Structure
```text
/
├── src/
├── public/
├── supabase/
├── docs/
├── tests/
├── .github/
├── package.json
├── README.md
└── LICENSE
```

# 16. GitHub Standards

Repository should include:
- README
- License
- Issue Templates
- Pull Request Template
- Contributing Guide
- Code of Conduct (optional for hackathon)

# 17. Branch Protection Rules

Protect `main` with:
- Required Pull Request
- Passing CI checks
- Up-to-date branch before merge
- No force pushes
- No branch deletion

# 18. Git Ignore

Exclude:
- node_modules/
- .next/
- .env*
- build/
- coverage/
- logs/
- IDE settings

Never ignore files that should be version controlled, such as migrations.

# 19. Repository Hygiene

Maintain:
- Small commits
- Clear commit messages
- Deleted merged branches
- Updated documentation
- Minimal stale branches

Review the repository regularly to remove obsolete code and documentation.

# 20. Future Improvements

Potential additions:
- Automatic changelog generation
- Dependabot
- Signed commits
- CODEOWNERS
- Release automation

# 21. Summary

The Git workflow emphasizes simplicity, rapid collaboration, and a clean project history.

By adopting trunk-based development, conventional commits, protected branches, and lightweight code reviews, the team can move quickly while maintaining confidence in every change that reaches production.
