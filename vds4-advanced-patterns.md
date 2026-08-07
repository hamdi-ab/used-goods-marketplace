# VinTech Design System (VDS)

# Part 4 — Advanced Design Patterns

> Version: 1.0

---

# Table of Contents

1. User Feedback Patterns
2. Loading Experience
3. Empty States
4. Error Recovery
5. Notifications
6. Trust Patterns
7. Marketplace UX Patterns
8. AI Interaction Patterns
9. Ethiopian Localization
10. Dark Mode Strategy
11. Accessibility Patterns
12. Microinteractions

---

# 1. User Feedback Patterns

Every user action must produce immediate feedback.

Categories:

- Visual
- Motion
- Message
- Sound (Future)

Examples

✓ Listing Published

✓ Favorite Added

✓ Offer Sent

✓ Image Uploaded

The user should never wonder if an action succeeded.

---

# 2. Loading Experience

## Principle

Replace uncertainty with progress.

Preferred loading order

1. Skeleton
2. Progressive Loading
3. Spinner (last resort)

---

## Skeleton Rules

Skeleton dimensions must closely match the final content.

Avoid generic gray rectangles.

---

## Progressive Loading

Load content in priority order.

Example

Navigation

↓

Hero

↓

Filters

↓

Listings

↓

Recommendations

---

# 3. Empty States

Every empty state must include

- Icon or Illustration
- Title
- Explanation
- Primary CTA

---

### Example

No Listings Found

"We couldn't find any items matching your filters."

Button

Clear Filters

---

### Favorites

"You haven't saved anything yet."

↓

Browse Marketplace

---

### Seller Dashboard

"You haven't listed any products."

↓

Create Listing

---

# 4. Error Recovery

Errors should always answer

- What happened?
- What can the user do next?

---

Bad

500 Internal Server Error

---

Good

"We couldn't load your listings."

↓

Retry

---

Critical errors include

- Retry
- Support link (future)
- Error ID

---

# 5. Notifications

Notification Types

Success

Warning

Information

Error

---

Priority

Toast

↓

Banner

↓

Modal

Use the least disruptive pattern possible.

---

# 6. Trust Patterns

Trust is the primary UX objective.

Display prominently

✓ Seller Rating

✓ Verification Badge

✓ Joined Date

✓ Response Time (Future)

✓ Number of Listings

✓ Report Button

✓ Condition Badge

✓ Location

---

Trust indicators should always appear before the Contact Seller action.

---

# 7. Marketplace UX Patterns

Listing Detail Priority

Images

↓

Price

↓

Condition

↓

Title

↓

Seller

↓

Description

↓

Location

↓

Related Listings

---

Search Priority

Keyword

↓

Category

↓

Price

↓

Condition

↓

City

↓

Sort

---

Seller Profile Priority

Avatar

↓

Verification

↓

Rating

↓

Listings

↓

Contact

---

# 8. AI Interaction Patterns

AI suggestions should always be editable.

Never lock generated content.

---

AI Generated Fields

- Title
- Description
- Category
- Condition

Each generated field should show

✨ Suggested by AI

Users may

Accept

Edit

Replace

Regenerate

---

# 9. Ethiopian Localization

Currency

ETB

---

Numbers

1,250 ETB

---

Language Strategy

Phase 1

English

Future

- Amharic
- Afaan Oromo
- Tigrinya

---

Phone Numbers

Support Ethiopian formatting.

---

Location

Use:

City

↓

Sub City

↓

Neighborhood (Optional)

---

Maps should not be required for the MVP.

---

# 10. Dark Mode Strategy

Not included in MVP.

Future Principles

- Same semantic colors
- Reduced contrast glare
- Preserve accessibility
- No pure black

---

# 11. Accessibility Patterns

Keyboard

Every interactive component is keyboard accessible.

---

Focus

Always visible.

Never remove browser focus without replacement.

---

Screen Readers

Every

- Button
- Image
- Input
- Dialog

must have accessible labels.

---

Contrast

Minimum WCAG AA.

---

Animations

Respect

prefers-reduced-motion

---

# 12. Microinteractions

Good interactions make the product feel responsive.

Examples

❤️ Favorite animation

📤 Upload progress

⭐ Rating hover

📷 Image preview

✔ Listing published confirmation

Microinteractions should be subtle and complete within 300ms.

---

# Summary

Advanced design patterns define how the marketplace communicates with users during every stage of interaction. By combining meaningful feedback, trust indicators, localization, accessibility, and AI transparency, the interface becomes intuitive, reliable, and inclusive.