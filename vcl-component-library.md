# VinTech Component Library (VCL)

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Draft
>
> **Owner:** Frontend Team
>
> **Framework:** React 19 + Next.js 15 + shadcn/ui + TailwindCSS

---

# Table of Contents

1. Introduction
2. Component Architecture
3. Design Principles
4. Component Categories
5. Layout Components
6. Navigation Components
7. Form Components
8. Marketplace Components
9. Trust Components
10. Feedback Components
11. Dashboard Components
12. Accessibility Standards
13. Component Checklist

---

# 1. Purpose

The VinTech Component Library defines every reusable UI component used throughout the application.

Goals:

- Maximum reuse
- Consistent behavior
- Faster development
- Better accessibility
- Easier maintenance

Every screen should be assembled from components in this library rather than creating custom UI each time.

---

# 2. Component Architecture

Every component follows this structure:

```text
Component
│
├── UI
├── Props
├── States
├── Accessibility
├── Variants
└── Tests
```

---

# 3. Component Principles

Every component must be:

- Reusable
- Predictable
- Accessible
- Themeable
- Responsive
- Testable

---

# 4. Folder Structure

```text
components/

ui/
layout/
navigation/
marketplace/
dashboard/
feedback/
trust/
forms/
shared/
```

---

# 5. Component Naming

React Component

```text
ListingCard
```

File

```text
listing-card.tsx
```

Hook

```text
use-listings.ts
```

---

# 6. Component Anatomy

Every component documentation contains:

Purpose

Props

Variants

States

Accessibility

Example Usage

Related Components

Design Token References

---

# 7. Component Status

Each component is classified as:

🟢 Stable

🟡 Beta

🔴 Experimental

⚫ Deprecated

---

# 8. Global Standards

Every component supports:

- Keyboard navigation
- Focus state
- Loading state (if applicable)
- Disabled state
- Error state (if applicable)
- Mobile responsiveness

---

# Summary

The Component Library serves as the implementation reference for every reusable interface element in the VinTech Marketplace.

# Layout Components

---

## AppShell

### Purpose

Root application layout.

Contains:

- Header
- Main Content
- Footer
- Toast Container

---

## Container

Purpose

Standard page width.

Variants

- Small
- Medium
- Large
- Full Width

---

## Section

Purpose

Vertical spacing between page sections.

Supports

- Background variants
- Padding variants

---

## PageHeader

Displays:

- Title
- Subtitle
- Breadcrumbs
- Optional actions

---

## Divider

Variants

- Horizontal
- Vertical
- Dashed

---

## Grid

Responsive grid wrapper.

Desktop

12 Columns

Tablet

8 Columns

Mobile

4 Columns

---

## Stack

Vertical layout helper.

Supports

- Gap tokens
- Alignment
- Distribution

---

## Spacer

Adds design-token spacing.

Never use empty divs for spacing.

---

## ScrollArea

Custom scrollable content.

Used in:

- Filter panel
- Notifications
- Messages

# Navigation Components

---

## TopNavbar

Contains

- Logo
- Search
- Categories
- Notifications
- Profile

Variants

Desktop

Tablet

---

## BottomNavigation

Mobile only.

Maximum

5 items.

---

## Sidebar

Dashboard navigation.

Supports

- Collapse
- Nested items
- Active indicator

---

## Breadcrumb

Displays navigation hierarchy.

---

## Pagination

Desktop

Numbered

Mobile

Load More

---

## Tabs

Supports

- Icons
- Badges
- Swipe (mobile)

---

## Dropdown Menu

Supports

- Keyboard
- Search
- Icons

---

## Command Palette (Future)

Shortcut

Ctrl + K

Allows global search and navigation.


# Form Components

---

## Button

Variants

Primary

Secondary

Outline

Ghost

Destructive

Sizes

SM

MD

LG

Supports

Loading

Disabled

Icon

Full Width

---

## TextField

Supports

- Label
- Helper Text
- Validation
- Prefix
- Suffix

---

## TextArea

Auto-resize.

Character counter.

---

## SearchField

Integrated search icon.

Clear button.

Keyboard shortcut.

---

## Select

Supports

Search

Groups

Icons

---

## MultiSelect

Used for

Multiple categories.

---

## Checkbox

Supports

Indeterminate state.

---

## Radio Group

Accessible.

Keyboard navigable.

---

## Switch

Boolean settings.

---

## Slider

Price range.

---

## Date Picker

Future support.

---

## ImageUploader

Critical marketplace component.

Supports

- Drag & Drop
- Mobile Upload
- Multiple Images
- Reordering
- Compression
- Progress Indicator
- Preview
- Remove Image

Maximum

10 Images

---

## Form

Features

Validation

Submit State

Error Summary

Loading


# Marketplace Components

---

## Hero Section

Landing page hero.

Contains

Headline

CTA

Search

Categories

---

## Search Bar

Large search experience.

Supports

Autocomplete (Future)

Recent Searches

---

## Category Grid

Displays categories.

Examples

Electronics

Furniture

Fashion

Vehicles

Appliances

Books

Others

---

## Listing Card ⭐

Most important component.

Displays

Image

Price

Condition

Title

Location

Seller

Verification Badge

Favorite Button

Time Posted

Variants

Compact

Standard

Featured

---

## Listing Gallery

Supports

Zoom

Thumbnail navigation

Swipe

Fullscreen

---

## Listing Details

Displays

Full Description

Specifications

Seller

Reviews

Offer Button

Contact Buttons

---

## Condition Badge

Variants

Brand New

Like New

Lightly Used

Fair

Needs Repair

---

## Price Display

Supports

Original Price

Negotiable Badge

Discount (Future)

---

## Favorite Button

States

Saved

Not Saved

Loading

---

## Offer Card

Displays

Offer Amount

Status

Date

Buyer

---

## Contact Card

Buttons

Telegram

Phone Call

Future

In-app Chat

---

## Seller Card

Displays

Avatar

Name

Verification

Rating

Member Since

Listing Count

Response Time (Future)

---

## Review Card

Displays

Stars

Comment

Date

Reviewer

---

## Report Dialog

Reasons

Spam

Fraud

Wrong Category

Sold Already

Other