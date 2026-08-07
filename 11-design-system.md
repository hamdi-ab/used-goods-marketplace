# Design System

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Draft
>
> **Owner:** Design & Frontend Team

---

# 1. Purpose

This document defines the visual language and component standards of the marketplace.

It provides the tokens, color palette, typography, spacing, radius, shadows, breakpoints, and component specifications that ensure a consistent, trustworthy, and accessible experience.

It implements `09-frontend-architecture.md` Section 15 (Design Tokens): design values are centralized and never hardcoded in components.

---

# Design Principles

These principles guide every UI and UX decision made throughout the product.

---

# 1. Trust Before Beauty

Users should immediately feel that the platform is safe.

Examples:

✓ Clear seller information

✓ Visible verification badges

✓ Large product photos

✓ Honest condition indicators

✓ Consistent spacing

Never sacrifice clarity for decoration.

---

# 2. Speed is a Feature

The interface should feel fast.

Examples:

✓ Skeleton loaders

✓ Optimistic updates

✓ Instant search feedback

✓ Lightweight animations

✓ Fast image loading

---

# 3. Mobile First

Most Ethiopian users browse on mobile.

Desktop is an enhancement—not the primary experience.

Design every component for mobile before scaling to larger screens.

---

# 4. Content Over Decoration

The product listing is the hero.

UI should support the content—not compete with it.

---

# 5. Progressive Disclosure

Show only what the user needs now.

Advanced options appear only when necessary.

Example:

Create Listing

↓

Basic Info

↓

Photos

↓

Pricing

↓

Location

↓

Review

---

# 6. Accessibility by Default

Every component should work with:

- Keyboard navigation
- Screen readers
- High contrast
- Touch-friendly sizing

---

# 7. Consistency Creates Trust

The same action should always look and behave the same.

Example:

Primary buttons are always green.

Delete actions are always red.

Secondary buttons are always outlined.

---

# 8. Feedback Everywhere

Every action provides feedback.

Examples:

✓ Saved

✓ Uploaded

✓ Failed

✓ Loading

✓ Success

Users should never wonder what happened.

---

# 9. Human Language

Avoid technical wording.

Instead of:

"Authentication Failed"

Use:

"Incorrect email or password."

---

# 10. Respect User Attention

Avoid unnecessary:

- Popups
- Animations
- Confirmations
- Notifications

Every interaction should have a purpose.

---

## Brand Personality

The marketplace should feel like a helpful local community—not a corporate e-commerce giant.

**Brand attributes:** Trustworthy · Friendly · Practical · Modern · Local · Honest · Efficient

**It is NOT:** flashy, luxurious, aggressive, overly playful, overdesigned.

**Voice:** warm, simple, professional, human.

| Instead of | Use |
|---|---|
| "Authentication Failed" | "Incorrect email or password." |
| "Error 500" | "Something went wrong. Please try again." |

## Core Experience Pillars

Every feature should strengthen at least one pillar:

- **Discover** — finding the right item should be effortless.
- **Trust** — users should feel safe buying from strangers.
- **Connect** — buyer↔seller communication should require minimal effort.
- **Decide** — users should have enough information to make confident purchasing decisions.
- **Act** — every important action should be obvious (Contact Seller, Make Offer, Save Listing, Report Listing).

## Visual Language

Inspired by Airbnb (clarity), Apple (spacing), Notion (minimalism), Telegram (familiarity), and Facebook Marketplace (discoverability) — combined into an identity built for Ethiopian community commerce.

## Design Constraints

Mobile-first · Responsive web · Low-bandwidth friendly · Touch interaction · WCAG AA · Fast rendering.

# 11. Brand Colors

## Primary — Trust Green

Used for primary actions, positive states, and the verification badge.

| Token | Value |
|----------|-------|
| `--primary` | `#16a34a` |
| `--primary-hover` | `#15803d` |
| `--primary-active` | `#166534` |
| `--primary-muted` | `#f0fdf4` |
| `--on-primary` | `#ffffff` |

---

## Semantic Colors

| Token | Value | Usage |
|----------|-------|-------|
| `--success` | `#16a34a` | Confirmation, saved, published |
| `--warning` | `#d97706` | Caution, pending states |
| `--danger` | `#dc2626` | Delete, report, blocked |
| `--info` | `#0284c7` | Updates, informational |

---

## Neutrals

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#ffffff` | App background |
| `--bg-subtle` | `#f9fafb` | Cards, sections |
| `--surface` | `#ffffff` | Elevated surfaces |
| `--border` | `#e5e7eb` | Borders, dividers |
| `--text-primary` | `#111827` | Headings |
| `--text-secondary` | `#4b5563` | Body text |
| `--text-muted` | `#9ca3af` | Placeholders, disabled |

---

# 12. Typography

Family: system font stack with Inter fallback, consistent with the Tailwind default.

Scale:

| Token | Size | Weight | Usage |
|----------|------|--------|-------|
| `--text-display` | 40px / 2.5rem | Bold | Landing hero |
| `--text-h1` | 28px / 1.75rem | Bold | Page title |
| `--text-h2` | 22px / 1.375rem | Semibold | Section title |
| `--text-h3` | 18px / 1.125rem | Semibold | Card title |
| `--text-body` | 16px / 1rem | Regular | Body text |
| `--text-body-sm` | 14px / 0.875rem | Regular | Secondary text |
| `--text-caption` | 12px / 0.75rem | Regular | Metadata |

Numbers, prices, and scores use tabular figures for aligned consistency.

---

# 13. Spacing Scale

Base unit: `4px`.

| Token | Value |
|----------|-------|
| `--space-0` | 0 |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-12` | 48px |

Standard rhythm:

- Card inner padding: `--space-4`
- Section gaps: `--space-8`
- Page margins: `--space-4` mobile, `--space-6` desktop

---

# 14. Border Radius & Shadows

## Radius

| Token | Value | Usage |
|----------|-------|-------|
| `--radius-sm` | 6px | Compact buttons, chips |
| `--radius-md` | 10px | Cards, inputs |
| `--radius-lg` | 14px | Modals, sheets |
| `--radius-full` | 9999px | Avatars, badges |

---

## Shadows

| Token | Value | Usage |
|----------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Cards |
| `--shadow-lg` | `0 12px 32px rgba(0,0,0,0.12)` | Modals, menus |

---

# 15. Breakpoints

Mobile-first, per NFR-COMP-003 (320px–1920px).

| Token | Width | Behavior |
|----------|-------|----------|
| `--bp-sm` | 640px | Stacked single column |
| `--bp-md` | 768px | Two-column card grid |
| `--bp-lg` | 1024px | Full desktop layout, larger margins |
| `--bp-xl` | 1280px | Content width cap |

---

# 16. Core Buttons

| Variant | Background | Border | Text | Usage |
|----------|-----------|--------|------|-------|
| Primary | `--primary` | none | `--on-primary` | Main action (e.g. Publish) |
| Secondary | `--surface` | `--border` | `--text-primary` | Alternative action |
| Danger | `--danger` | none | `#ffffff` | Delete, report |
| Ghost | transparent | none | `--text-primary` | Rows, subtle actions |
| Trust Badge | `--primary-muted` | none | `--primary-active` | Verification, score |

States for every variant:

- Default
- Hover
- Active
- Focus (visible ring, WCAG AA)
- Disabled (`--text-muted`)
- Loading (spinner, content hidden)

---

# 17. Trust & Score Components

## Trust Score Badge

Number (0–100) in the primary color with a short label.

## Verification Indicators

- Verified Email: check mark with label
- Verified Phone: phone glyph
- Telegram Linked: Telegram glyph
- Trust Score: score badge

Empty state: "Not verified yet."

---

# 18. Product Card

Structure:

- **Image** (4:3, lazy-loaded, `--radius-md`)
- **Title** (h3, 2-line clamp)
- **Price** (tabular figures, semibold)
- **Location** (caption, `--text-muted`)
- **Condition** chip
- **Trust indicator** (verified badge or score)

Interactions:

- Tap navigates to the product page
- Heart badge for favorite (top-right; always visible on mobile, hover on desktop)
- Sold overlay (badge only, CTA disabled)

---

# 19. Form Components

Fields:

- **Label** (`--text-body-sm`, always visible)
- **Input / Select** (`--radius-md`, `--border`, focus ring in primary)
- **Error** (`--danger`, below field, with message)

Validation feedback:

- Real-time validation on blur
- Banner on submit
- Inline error with corrective suggestion

---

# 20. Loading & Empty States

Loading:

- Skeleton cards for listing grids and product pages
- Skeleton widgets for dashboard
- Spinner only for small, inline actions

Empty States (paired with one primary action):

- Search: "No products found." → Clear filters / suggestions
- Favorites: "Nothing saved yet." → Browse
- Dashboard: "Create your first listing." → Create Listing

---

# 21. Responsive Behavior

- **Mobile (default):** single column, bottom action bar, touch targets ≥44px
- **Tablet / Desktop:** side-by-side layouts, hover states, wider margins
- Grids scale at `--bp-md` and `--bp-lg`

---

# 22. Accessibility Checklist

- WCAG AA contrast for all text and UI
- Keyboard-navigable all interactions
- Visible focus states (ring on focus)
- Semantic HTML and ARIA labels
- Screen-reader-announced loading and live regions
- Touch targets ≥44px on mobile
- Alt text on all images

---

# 23. Component Library Mapping

Built on **shadcn/ui** (ADR-007), customized with the tokens above via Tailwind.

| shadcn/ui base | Marketplace use |
|--------------------|------------------|
| Button | Buttons, CTA |
| Card | Listing card, dashboard widgets |
| Input / Textarea | Forms |
| Select | Category, condition |
| Badge | Condition, status, stock |
| Avatar | Seller profile |
| Skeleton | Loading states |
| Dialog | Offer modal |
| DropdownMenu | Listing menu |
| Tabs | Dashboard sections |

---

# 24. Dark Mode (Future)

Not in MVP. When enabled, respect the same contrast rules using the neutral palette reversed; never change semantic color hues.

---

# 25. Summary

This design system translates the Trust / Speed / Simplicity philosophy, the brand personality, and the Discover / Trust / Connect / Decide / Act pillars into reusable tokens and component standards.

It gives developers a consistent, accessible, mobile-first foundation and directly supports the Lighthouse Accessibility ≥ 95 goal while keeping the product listing as the hero of every screen.
