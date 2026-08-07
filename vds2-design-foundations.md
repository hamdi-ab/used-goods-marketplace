# VinTech Design System (VDS)

## Part 2 — Design Foundations

> Version: 1.0

---

# Table of Contents

1. Color System
2. Semantic Colors
3. Typography
4. Spacing System
5. Grid System
6. Layout Containers
7. Border Radius
8. Elevation & Shadows
9. Iconography
10. Imagery
11. Motion
12. Responsive Design
13. Accessibility Tokens
14. Design Tokens Summary

---

# 1. Color System

## Philosophy

Colors communicate hierarchy, trust, and feedback—not decoration.

The palette is intentionally minimal to create a clean, modern marketplace experience where listings remain the focal point.

---

## Primary Palette

### Primary 500

```text
#2563EB
```

Purpose:

- Primary Buttons
- Active Navigation
- Links
- Selected States

---

### Primary Scale

| Token | Hex |
|--------|------|
| Primary 50 | #EFF6FF |
| Primary 100 | #DBEAFE |
| Primary 200 | #BFDBFE |
| Primary 300 | #93C5FD |
| Primary 400 | #60A5FA |
| Primary 500 | #2563EB |
| Primary 600 | #1D4ED8 |
| Primary 700 | #1E40AF |
| Primary 800 | #1E3A8A |
| Primary 900 | #172554 |

---

# Neutral Palette

Used for:

- Backgrounds
- Cards
- Text
- Borders

| Token | Hex |
|--------|------|
| Gray 50 | #F9FAFB |
| Gray 100 | #F3F4F6 |
| Gray 200 | #E5E7EB |
| Gray 300 | #D1D5DB |
| Gray 400 | #9CA3AF |
| Gray 500 | #6B7280 |
| Gray 600 | #4B5563 |
| Gray 700 | #374151 |
| Gray 800 | #1F2937 |
| Gray 900 | #111827 |

---

# Success

```text
#22C55E
```

Uses

- Verified Seller
- Successful Upload
- Payment Success
- Positive Status

---

# Warning

```text
#F59E0B
```

Uses

- Pending
- Draft
- Fair Condition
- Attention Required

---

# Error

```text
#EF4444
```

Uses

- Delete
- Failed Upload
- Validation Errors
- Reported Content

---

# Information

```text
#0EA5E9
```

Uses

- Tips
- Notifications
- Helpful Information

---

# 2. Semantic Colors

Rather than referencing raw colors, components should use semantic tokens.

Example

Instead of

```text
Blue500
```

Use

```text
color.primary
```

---

Available Tokens

```text
color.primary

color.secondary

color.surface

color.background

color.text.primary

color.text.secondary

color.success

color.warning

color.error

color.border

color.disabled
```

This allows future theming without changing component implementations.

---

# 3. Typography

## Typeface

Primary Font

```text
Geist
```

Fallback

```text
Inter

System UI

sans-serif
```

---

# Font Scale

| Name | Size |
|------|------|
| Display | 48px |
| H1 | 40px |
| H2 | 32px |
| H3 | 28px |
| H4 | 24px |
| H5 | 20px |
| H6 | 18px |
| Body Large | 18px |
| Body | 16px |
| Body Small | 14px |
| Caption | 12px |

---

# Font Weight

| Weight | Usage |
|----------|--------|
| 400 | Body |
| 500 | Labels |
| 600 | Headings |
| 700 | Hero Titles |

---

# Line Height

| Style | Height |
|---------|---------|
| Display | 120% |
| Heading | 130% |
| Body | 150% |
| Caption | 150% |

---

# Text Rules

Maximum paragraph width

```text
70 characters
```

Avoid centered paragraphs except in hero sections.

---

# 4. Spacing System

The system follows an **8-point grid**.

Base Unit

```text
8px
```

Scale

| Token | Value |
|---------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 40px |
| 3xl | 48px |
| 4xl | 64px |
| 5xl | 80px |

Spacing should always use predefined tokens rather than arbitrary values.

---

# 5. Grid System

Desktop

```text
12 Columns
```

Tablet

```text
8 Columns
```

Mobile

```text
4 Columns
```

---

# Gutters

Desktop

```text
24px
```

Tablet

```text
20px
```

Mobile

```text
16px
```

---

# Max Width

Content Container

```text
1280px
```

---

# 6. Layout Containers

Small

```text
640px
```

Medium

```text
768px
```

Large

```text
1024px
```

Extra Large

```text
1280px
```

---

# 7. Border Radius

| Token | Value |
|--------|-------|
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 24px |
| full | 9999px |

Usage

Cards

```text
16px
```

Buttons

```text
12px
```

Badges

```text
9999px
```

Inputs

```text
12px
```

---

# 8. Elevation & Shadows

Elevation should indicate hierarchy.

Level 0

No Shadow

---

Level 1

Cards

```css
0 1px 2px rgba(0,0,0,.06)
```

---

Level 2

Dropdown

```css
0 4px 12px rgba(0,0,0,.08)
```

---

Level 3

Dialogs

```css
0 10px 30px rgba(0,0,0,.12)
```

---

Never stack multiple shadows.

---

# 9. Iconography

Icon Library

```text
Lucide React
```

Reasons

- Consistent
- Lightweight
- Open Source
- Modern

---

Icon Sizes

| Size | Usage |
|--------|------|
| 16 | Inline |
| 20 | Buttons |
| 24 | Navigation |
| 32 | Empty States |
| 48 | Hero Graphics |

---

# 10. Imagery

Listing Photos

Requirements

- High resolution
- 4:3 preferred
- Lazy loaded
- Object-fit: cover

Fallback

Placeholder image when no photo exists.

---

Seller Avatar

Preferred

Circular

64×64

---

# 11. Motion

Animations should support understanding—not decoration.

Duration

Fast

150ms

Standard

250ms

Slow

350ms

---

Easing

```text
ease-out
```

Preferred Transitions

- Fade
- Scale
- Slide

Avoid:

- Bounce
- Flash
- Excessive rotation

---

# 12. Responsive Breakpoints

| Device | Width |
|---------|--------|
| Mobile | 360px |
| Small Tablet | 640px |
| Tablet | 768px |
| Laptop | 1024px |
| Desktop | 1280px |
| Large Desktop | 1536px |

Design mobile-first.

---

# 13. Accessibility Tokens

Minimum touch target

```text
44 × 44 px
```

Minimum contrast

```text
WCAG AA
```

Focus Ring

```text
2px Primary 500
```

Interactive elements must always display a visible focus state.

---

# 14. Design Tokens Summary

## Colors

- Primary
- Success
- Warning
- Error
- Neutral

---

## Typography

- Geist
- 12 text styles

---

## Spacing

- 8-point grid

---

## Radius

- 4–24px

---

## Shadows

- 3 elevation levels

---

## Icons

- Lucide React

---

## Motion

- 150–350ms
- ease-out

---

## Responsive

- Mobile-first
- 6 breakpoints

---

# Summary

These foundations establish the visual language for the VinTech Marketplace. By standardizing colors, typography, spacing, grids, elevation, and motion, the team can create interfaces that are visually consistent, accessible, and easy to implement across the application.