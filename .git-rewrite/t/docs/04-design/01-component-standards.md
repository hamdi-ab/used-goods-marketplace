# VinTech Design System (VDS)

## Part 3 — Component Standards

> Version: 1.0

# Table of Contents

1. Component Philosophy
2. Buttons
3. Inputs
4. Select & Dropdown
5. Search Bar
6. Cards
7. Badges
8. Chips
9. Tags
10. Avatars
11. Images
12. Navigation
13. Breadcrumbs
14. Tabs
15. Accordions
16. Tables
17. Lists
18. Pagination
19. Modals
20. Drawers
21. Toasts
22. Tooltips
23. Skeletons
24. Empty States
25. Error States
26. Loading States
27. Forms
28. Component Checklist

# 1. Component Philosophy

Every component should be:

- Reusable
- Accessible
- Predictable
- Composable
- Themeable

A component should solve one problem only.

# 2. Buttons

## Variants

### Primary

**Purpose:** Primary action on every page. **Examples:** Publish Listing, Login, Save Changes.

Only one primary button should dominate a section.

### Secondary

**Purpose:** Supporting actions. **Example:** Cancel, Back, View More.

### Outline

**Purpose:** Less emphasis while remaining interactive.

### Ghost

**Purpose:** Toolbar actions. **Examples:** Favorite, Share, Bookmark.

### Destructive

**Purpose:** Delete actions.

Always require confirmation.

## Sizes

| Size | Height |
|-------|--------|
| Small | 36px |
| Medium | 44px |
| Large | 52px |

## States

Every button supports

- Default
- Hover
- Active
- Focus
- Disabled
- Loading

Loading replaces the label with a spinner.

# 3. Inputs

Supported Types

- Text
- Number
- Email
- Password
- Phone
- Search
- Currency

Each Input Includes

- Label
- Placeholder
- Helper Text
- Error Message

Validation

Errors appear only after interaction or submission.

Never validate while typing unless necessary.

# 4. Select & Dropdown

Use for

- Categories
- Cities
- Conditions
- Sorting

Support:

- Keyboard navigation
- Search (large datasets)
- Clear selection

# 5. Search Bar

Features

- Search icon
- Placeholder
- Clear button
- Keyboard shortcut (/)
- Loading indicator

Future

- Recent searches
- Suggestions

# 6. Cards

Cards are the primary surface.

Types

- Listing Card
- Seller Card
- Statistic Card
- Dashboard Card

Standard Layout

Image → Title → Price → Condition → Location → Seller → Actions

# 7. Badges

**Purpose:** Display status. **Examples:** Verified, New, Sold, Featured, Pending.

Badges never act as buttons.

# 8. Chips

Used for:

- Filters
- Selected categories
- Search terms

Must be removable.

# 9. Tags

Display metadata.

Examples

- Furniture
- Electronics
- Addis Ababa
- Used

# 10. Avatars

Shapes

Circular only.

Fallback

Initials.

Sizes

32, 48, 64, 96

Verification badge overlays bottom-right.

# 11. Images

Every image supports

- Loading
- Error fallback
- Lazy loading
- Zoom (gallery)

Aspect Ratio

Listing: 4:3

# 12. Navigation

Desktop

Top Navigation

Mobile

Bottom Navigation

Maximum

5 primary destinations.

# 13. Breadcrumbs

Used on

- Category Pages
- Listing Details
- Settings

Avoid breadcrumbs on mobile where space is limited.

# 14. Tabs

Maximum

5 tabs.

Swipeable on mobile.

Never hide content behind multiple nested tabs.

# 15. Accordions

Used for

- FAQs
- Specifications
- Seller Information

Only one expanded by default.

# 16. Tables

Reserved for

- Admin Dashboard
- Reports
- Analytics

Avoid tables on mobile.

Prefer cards.

# 17. Lists

Spacing

16px

Support

- Dividers
- Hover
- Selection

# 18. Pagination

Desktop

Numbered Pagination

Mobile

Load More

or

Infinite Scroll

# 19. Modals

Maximum width

640px

Should never exceed 80% viewport height.

Critical actions require confirmation.

# 20. Drawers

Used on mobile for

- Filters
- Menus
- Settings

Should slide from the bottom or right depending on context.

# 21. Toasts

Duration

4 seconds

Variants

- Success
- Warning
- Error
- Info

Maximum

3 visible simultaneously.

# 22. Tooltips

Use only when labels cannot be displayed.

Do not hide essential information inside tooltips.

# 23. Skeletons

Replace loading spinners whenever possible.

Skeletons should match the final layout.

# 24. Empty States

Every empty page includes

- Illustration/Icon
- Title
- Explanation
- Primary Action

Example

"No favorites yet"

↓

Browse Listings

# 25. Error States

Every error includes

- Friendly title
- Explanation
- Retry action

Avoid technical jargon.

# 26. Loading States

Every async action should provide feedback.

Examples

- Spinner
- Skeleton
- Progress Bar
- Upload Progress

Never leave the user guessing.

# 27. Forms

Rules

- One primary action
- Logical grouping
- Inline validation
- Keyboard accessible
- Mobile friendly

Form Layout

Label → Input → Helper Text → Error

# 28. Component Checklist

Every component must support

- Responsive layout
- Accessibility
- Loading
- Error
- Empty state (if applicable)
- Keyboard navigation
- Focus state
- Dark mode compatibility (future)
- Theme tokens
- RTL readiness (future)

# 29. Implementation Mapping (shadcn/ui)

The component library is built on **shadcn/ui** (ADR-007), customized with the tokens above via Tailwind. This maps the VDS/VCL abstract components to concrete shadcn primitives.

| VDS/VCL component | shadcn/ui base |
|---|---|
| Button (all variants) | Button |
| Listing Card, dashboard widgets | Card |
| TextField / TextArea | Input / Textarea |
| Select, MultiSelect | Select / Combobox |
| Condition, verification status | Badge |
| Seller profile | Avatar |
| Loading states | Skeleton |
| Offer modal | Dialog |
| Listing menu | DropdownMenu |
| Dashboard sections | Tabs |
| Contact / report actions | DropdownMenu + AlertDialog |
| Trust Score display | Progress + Badge |
| Toasts / alerts | Sonner / Alert |

Tokens are consumed as CSS design tokens (e.g. `--primary`, `--success`) mapped into Tailwind theme variables — never hardcoded in components.

# Summary

These component standards ensure that every interface element behaves consistently across the application. By defining common patterns for interaction, validation, states, and accessibility, the design system provides a reliable foundation for both designers and developers.