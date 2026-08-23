# Admin Dashboard Sidebar — Moodboard & Research

> Research for: admin dashboard sidebar prototype on `polish/admin-routes`
> Date: 2026-08-23
> Sources: Linear, Vercel, Supabase, Stripe, PostHog, shadcn/ui sidebar patterns

---

## The question

Three structural directions for the admin sidebar, switchable via `?variant=`:

1. **Rail** — icon + label, collapsible to icons-only (Vercel/Supabase pattern)
2. **Grouped** — section headers with nested items (Linear/Stripe pattern)
3. **Dock** — bottom-fixed icon dock with tooltips (PostHog/Raycast pattern)

Each variant is a prototype — pick one or steal bits, then throw the rest away.

---

## Variant A — Rail (icon + label, collapsible)

**Seen in:** Vercel dashboard, Supabase studio, GitHub repositories, Railway

### Structure

```
┌─────────────────────┐
│  ◆ Brand            │  ← brand mark, stays when collapsed
│─────────────────────│
│  ▤  Dashboard       │  ← icon 16-20px, label 14px medium
│  ☰  Statistics     │  ← active: bg-primary/10 text-primary
│  ⚑  Reports    3    │  ← badge for actionable count
│  ☑  Verifications  │
│  👥  Users         │
│  📦  Listings      │
│─────────────────────│
│  ⚙  Account        │  ← footer section
│  ← Collapse         │  ← chevron toggle, bottom
└─────────────────────┘
```

### Key decisions

- **Width:** 240px expanded, 64px collapsed (icons + tooltip)
- **Active state:** subtle `bg-primary/10` pill, not a heavy left border. Left-stripe borders are the #1 AI slop tell — avoid.
- **Icon size:** 20px nav, not 24. 24px is too heavy at this density; 20px matches the body weight.
- **Section divider:** thin `bg-border` line between primary nav and footer items, not a labeled "SECTION" header (uppercase tracked headers are an AI grammar tell).
- **Badge:** a `secondary` variant Badge next to labels that have actionable counts (reports, verifications).
- **Collapse:** bottom-aligned chevron button that toggles width. When collapsed, hover shows a tooltip with the label.

### Source notes

- Vercel uses a 256px sidebar with 20px icons, label 14px/500 weight, active = `bg-primary/10 text-primary`
- Supabase studio has a collapsible rail (64px icons-only or 256px expanded) with a toggle at the bottom
- Both keep the brand mark visible in both states
- Neither uses uppercase section headers

---

## Variant B — Grouped (section headers with nesting)

**Seen in:** Linear settings, Stripe docs nav, Notion admin, Dashboard-heavy tools

### Structure

```
┌─────────────────────┐
│  ◆ Brand            │
│─────────────────────│
│  OVERVIEW           │  ← section label, 11px uppercase tracked
│  ▤  Dashboard       │
│  ☰  Statistics     │
│─────────────────────│
│  MODERATION         │
│  ⚑  Reports    3    │
│  ☑  Verifications  │
│─────────────────────│
│  MANAGE             │
│  👥  Users         │
│  📦  Listings      │
│─────────────────────│
│  ⚙  Account         │  ← footer, no section label
│  ⎋  Sign out        │
└─────────────────────┘
```

### Key decisions

- **Width:** 256px fixed (no collapse — grouping needs labels)
- **Section headers:** 11px uppercase tracked `text-muted-foreground`, NOT a colored chip. Muted, not loud.
- **Indentation:** items align to the same left edge as labels — no indent. Indenting tiny nav items wastes horizontal space.
- **Active state:** same as Variant A (`bg-primary/10 text-primary`)
- **Nesting:** no deep nesting. One level max. If you need nesting, that's a separate page, not a sub-menu.
- **Footer:** Account + Sign out live below the main nav, separated by a divider.

### Source notes

- Linear uses 240px sidebar with section headers (all-caps, 11px, tracked). Active item is a subtle pill, not a stripe.
- Stripe docs uses grouped sections with a 256px nav. Headers are uppercase 11px tracked gray. No left borders anywhere.
- Notion uses section labels but indents sub-items by 8px — their density justifies it; ours doesn't.
- The `#nav` is always `aria-label="Admin"` for screen readers.

---

## Variant C — Dock (bottom-fixed icon bar with labels)

**Seen in:** PostHog (mobile), Raycast (bottom suggestions), Linear (command palette anchor), mobile-first tools

### Structure

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                   (main content area)                    │
│                                                          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  🏠    📊    ⚑3    ☑    👥    📦    👤               │
│  Dash  Stats Reports ... Users List  Me                 │  ← 56px tall dock
└──────────────────────────────────────────────────────────┘
```

### Key decisions

- **Position:** bottom of viewport, fixed. Full-width content area above.
- **Height:** 56px (48px is too small for touch targets on mobile).
- **Items:** evenly distributed with icon on top, label below (10px muted). Label truncates at ~8 chars.
- **Active state:** icon gets a 48px rounded pill `bg-primary/10` behind it.
- **Badge:** small count badge top-right of icon (not a separate element).
- **When to use this:** mobile-first or when vertical space is at a premium. Wastes horizontal space on desktop.
- **Tooltip on hover:** not needed — labels are always visible.

### Source notes

- PostHog mobile app uses a bottom tab bar (5 icons, labels underneath, 56dp height)
- Raycast's command palette anchors to bottom-center but isn't persistent
- Linear's bottom bar is 44px on desktop — too small for our use
- Dock pattern works best when there are ≤ 6 items (ours has 7 + account = 8, which is the upper limit)

---

## Shared decisions (apply to all variants)

| Decision | Value | Why |
|----------|-------|-----|
| Font size (labels) | 14px / 500 weight | Matches Geist scale, readable at sidebar density |
| Icon size | 20px | 24px is too heavy; 16px is too small for touch |
| Active color | `bg-primary/10 text-primary` | Restrained. No left border, no full saturation |
| Divider | `bg-border` 1px line | Separates primary nav from footer |
| Brand | Logo "V" + site name | Stays visible when collapsed |
| Mobile | Sheet (slide-in) | Same as current `AdminShell` behavior |
| Badge counts | `secondary` variant | For reports, verifications — actionable numbers |
| Sign out | Ghost button, bottom of sidebar | Same position in all variants |

---

## What to avoid (from source research)

- **Left-stripe borders on active items.** Vercel, Linear, Stripe, Supabase — none of them do this. It's the most saturated AI pattern of 2026.
- **Uppercase tracked section headers everywhere.** One or two deliberate section labels = voice. A kicker above every section = AI grammar. (Linear does it sparingly.)
- **Gradient active states.** Active = solid muted background, never a gradient or glassmorphism.
- **Nested dropdowns in the sidebar.** If you need sub-navigation, use a separate page or a tab bar at the top of the content area.
- **24px icons in the sidebar.** They're for empty states, not nav density.

---

## Next step

Build all three variants as React components, mount them via `?variant=A|B|C` on the admin layout. User flips through, picks a direction, we fold the winner into the real code.

Files to modify/create:
- `components/admin/sidebar-variant-a.tsx` — Rail
- `components/admin/sidebar-variant-b.tsx` — Grouped
- `components/admin/sidebar-variant-c.tsx` — Dock
- `components/admin/admin-shell.tsx` — mount the active variant
