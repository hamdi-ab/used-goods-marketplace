# Micro-Interactions & Animation Research — Dagim Gebeya

> **Project:** Dagim Gebeya — Used Goods Marketplace
> **Version:** 1.0.0
> **Owner:** Frontend / UX Engineering
> **Status:** Research Complete
> **Date:** 2026-08-24
> **Stacks:** Next.js 16 · Tailwind CSS · shadcn/ui · Radix UI · Motion for React

---

## 1. Purpose & Scope

This document provides a practical, implementable guide to micro-interactions and animations that enhance conversion, trust, and engagement for **Dagim Gebeya** — a second-hand goods marketplace. Every recommendation is grounded in industry patterns from eBay, Facebook Marketplace, Mercari, Etsy, and OfferUp, filtered through our existing design system and component stack.

### Design system constraints

| Token | Value |
|-------|-------|
| Primary accent | `#2563EB` (blue-600) |
| Background tint | `#172554` (navy-950) |
| Component library | shadcn/ui + Radix UI primitives |
| Animation engine | Motion for React (`motion/react`) |
| Styling | Tailwind CSS utility classes |
| Accessibility baseline | WCAG 2.1 SC 2.3.3 — `prefers-reduced-motion` |

---

## 2. The Three Animation Engines

### 2.1 When to use which

| Engine | Best for | Use when | Examples |
|--------|----------|----------|----------|
| **Tailwind CSS transitions** | Simple, declarative state changes | Hover/focus/active pseudo-classes, color/shadow/size tweaks, toggles | Card hover lift, button press, focus rings, trust badge color shift |
| **Radix UI animations** | Component-internal motion | Built-in to Radix primitives — dialog, sheet, dropdown, tooltip, toast | Dialog slide-down, toast enter/exit, dropdown fade-scale, tooltip fade |
| **Motion for React** | Orchestrated, gesture-driven, layout, exit, scroll | Everything CSS can't do: spring physics, layout animations, drag, exit animations, scroll-triggered, gesture hovers | Image lightbox expand, favorite heart burst, card grid reorder, scroll-reveal, page transitions |

### 2.2 Decision flowchart

```
Is it a simple hover / focus / active state?
  YES → Tailwind transition / Tailwind animate-* utility
  NO  → Is it a built-in Radix component (Dialog, Sheet, Dropdown, Toast, Tooltip)?
          YES → Use Radix's built-in animation classes (data-[state=...] variants)
          NO  → Is it layout, gesture, exit, scroll, or spring physics?
                YES → Motion for React (motion.* + AnimatePresence + useSpring)
                NO  → Tailwind transition (e.g. color on toggle)
```

### 2.3 The golden rule

**Don't add Motion for React where CSS or Radix already does the job.** Every third-party animation dependency is a bundle cost. Favor the cheapest engine that achieves the effect. Use Motion for React for the 15% of interactions that need physics, gestures, layout transitions, or exit animations.

---

## 3. Animation Fundamentals

### 3.1 Timing — the rhythm of interaction

| Duration | Use case |
|----------|----------|
| **100ms** | Micro-feedback: button press, toggle switch, checkbox tick |
| **150–200ms** | Standard transitions: hover states, color changes, focus rings, tooltips |
| **250–350ms** | Card reveals, dropdowns, sheet slides, toast enter/exit |
| **350–500ms** | Layout shifts, modals, lightbox expand, page transitions |
| **>500ms** | Hero entrance, storytelling scroll, intentional drama — use sparingly |

**Rule of thumb:** Elements the user directly manipulates respond in ≤200ms. System-initiated transitions can stretch to 350ms. Anything beyond 500ms feels broken unless it's intentional (e.g., onboarding walkthrough).

### 3.2 Easing — the personality curve

| Easing | Formula feel | Use case |
|--------|--------------|----------|
| `ease-out` | Fast start, slow end (deceleration) | Elements **entering** the screen — cards, modals, toasts, dropdowns |
| `ease-in` | Slow start, fast end (acceleration) | Elements **leaving** the screen — modals closing, cards dismissing |
| `ease-in-out` | Slow start + slow end, fast middle | Elements **moving between states** — layout reorders, toggles, shared layout |
| `cubic-bezier(0.34, 1.56, 0.64, 1)` | Overshoot spring (Tailwind `ease-out-back`) | Playful micro-bounces — favorite heart, add-to-cart, badge pop |
| `linear` | Constant velocity | Progress bars, loading indicators, continuous motion |

**Recommended defaults:**
- Enter: `ease-out` or spring (`type: "spring"`, stiffness 300, damping 30)
- Exit: `ease-in`, duration 200ms
- Hover/active: `ease-out`, duration 150ms
- Layout reorder: spring with low stiffness (~200) and damping (~25)

### 3.3 Spring vs. tween

Motion for React defaults to **spring** for physical properties (`x`, `y`, `scale`, `rotate`) and **tween** for visual properties (`opacity`, `backgroundColor`). This is the right default — springs feel alive, tweens feel mechanical.

| Scenario | Recommended |
|----------|-------------|
| Card hover lift | Tween, 150ms ease-out |
| Favorite button heart burst | Spring, stiffness 500, damping 15 |
| Dialog open/close | Tween, 200ms ease-in-out |
| Image lightbox expand from thumbnail | Spring, stiffness 260, damping 20 |
| Page scroll-reveal | Tween, 350ms ease-out |
| Grid card reorder | Spring, stiffness 200, damping 25 |

### 3.4 The will-change rule

Always set `will-change: transform` (or `will-change: transform, opacity`) on elements that will animate — it hints the browser to promote them to the GPU layer. In Tailwind, this is `will-change-transform`. **Never** apply `will-change` broadly — only on elements about to animate, and remove it when idle to avoid memory pressure.

---

## 4. Accessibility — Motion as a First-Class Concern

### 4.1 `prefers-reduced-motion` — non-negotiable

**WCAG 2.1 SC 2.3.3 (Level AAA):** Motion animation triggered by interaction can be disabled unless essential. All three engines must honor this.

**The pattern — wrap every animation in a reduced-motion guard:**

```css
/* CSS / Tailwind approach */
@media (prefers-reduced-motion: no-preference) {
  .card-hover-lift {
    transition: transform 150ms ease-out, box-shadow 150ms ease-out;
  }
  .card-hover-lift:hover {
    transform: translateY(-4px);
  }
}
```

```tsx
// Motion for React approach
const prefersReducedMotion = usePrefersReducedMotion()

<motion.div
  whileHover={prefersReducedMotion ? {} : { y: -4, scale: 1.02 }}
  transition={{ duration: 0.15, ease: "easeOut" }}
/>
```

```tsx
// Tailwind + conditional class
<div className={cn(
  "rounded-xl shadow-md",
  !prefersReducedMotion && "transition-all duration-150 ease-out hover:-translate-y-1 hover:shadow-lg"
)}>
```

### 4.2 React hook for reduced motion

Create once in `web/src/lib/hooks/use-prefers-reduced-motion.ts`:

```tsx
import { useEffect, useState } from "react"

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handler = () => setPrefersReducedMotion(mediaQuery.matches)
    handler()
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  return prefersReducedMotion
}
```

### 4.3 Reduced-motion ≠ no-motion

Per Michelle Barker / Smashing Magazine and CSS-Tricks best practices:

- A small icon shift (arrow nudge, 2–3px) is fine even with reduced motion — it's a state indicator, not decoration.
- Replace scale/rotate animations with color/shadow changes when motion is reduced.
- Replace animated transitions with instant state swaps for position changes.
- **Never** use `* { animation: none !important }` globally — it removes color transitions too, which can feel more jarring.

### 4.4 Site-level motion toggle (optional upgrade)

Beyond `prefers-reduced-motion`, consider a site toggle that persists to `localStorage`. This catches users who don't know their system settings or share devices. Pattern:

```tsx
const [motionEnabled, setMotionEnabled] = useState(true)
// Initialize from localStorage / system preference
// Persist on toggle
// Toggle button in header or settings
```

When toggled off, set `data-motion="reduced"` on `<html>` and key off it in CSS:

```css
html[data-motion="reduced"] .animated-element {
  animation: none;
  transition: none;
}
```

---

## 5. Page-by-Page Micro-Interaction Spec

### 5.1 Home Page

| Element | Interaction | Engine | Spec |
|---------|-------------|--------|------|
| Hero CTA button | Hover + press | Tailwind | `hover:bg-blue-700 active:scale-95 transition-all duration-150` |
| Hero CTA button | Entrance on page load | Motion | `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}` |
| Metric counters | Count-up on viewport entry | Motion | `useInView` + `useMotionValue` + `useTransform` + `animate` — numbers tick from 0 to target |
| Category pills | Hover | Tailwind | `hover:bg-blue-600 hover:text-white hover:scale-105 transition-all duration-150 ease-out` |
| Category pills | Active press | Tailwind | `active:scale-95` |
| Listing cards (bento grid) | Entrance stagger | Motion | `initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}` with per-index delay |
| Testimonial cards | Subtle float on hover | Tailwind | `hover:-translate-y-1 hover:shadow-lg transition-all duration-200` |
| Scroll indicator (hero arrow) | Bounce loop | Motion | `animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}` — only when `!prefersReducedMotion` |

### 5.2 Listing Detail Page

| Element | Interaction | Engine | Spec |
|---------|-------------|--------|------|
| Gallery thumbnail → lightbox | Shared layout expand | Motion | `layoutId="listing-image-{id}"` — clicking thumbnail expands into a full-viewport lightbox with spring transition |
| Gallery image (lightbox) | Drag to dismiss | Motion | `drag="y"` with `dragConstraints` and `onDragEnd` — drag down past threshold closes |
| Thumbnail strip | Hover lift | Tailwind | `hover:-translate-y-0.5 hover:shadow-md transition-all duration-150` |
| "Make Offer" button | Hover + press | Tailwind | `hover:bg-blue-700 active:scale-[0.97] transition-all duration-150` |
| Trust badges | Entrance stagger on scroll | Motion | `whileInView={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: -8 }} viewport={{ once: true }}` |
| Seller card | Hover lift | Tailwind | `hover:-translate-y-1 transition-transform duration-200` |
| Price reveal (optional) | Count up from 0 on viewport entry | Motion | `useMotionValue(0)` + `useAnimate` to target price |

### 5.3 Listing Card (reusable)

| Element | Interaction | Engine | Spec |
|---------|-------------|--------|------|
| Card container | Hover lift | Tailwind | `hover:-translate-y-1 hover:shadow-lg transition-all duration-200 ease-out` |
| Listing image | Hover zoom (gentle) | Tailwind | Inner `<img>` with `group-hover:scale-105 transition-transform duration-300 ease-out` |
| Favorite button | Heart burst on toggle | Motion | `whileTap={{ scale: [1, 1.4, 1] }}` + icon swap `animate={{ scale: [1, 1.2, 1] }}` — spring stiffness 500, damping 12 |
| Favorite button | Optimistic state | React state | Toggle `isFavorite` instantly, show toast on error revert |
| Trust badge (e.g. "Verified") | Subtle pulse (occasional) | Motion | `animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}` — only if not reduced-motion and badge is newly-earned |
| Seller avatar row | Hover underline on name | Tailwind | `hover:underline underline-offset-2` |
| Card entrance | Staggered fade-up | Motion | See home page — consistent across all grids |

### 5.4 Favorites Grid

| Element | Interaction | Engine | Spec |
|---------|-------------|--------|------|
| Unfavorite action | Undo toast | Radix Toast | `duration: 5000`, action button "Undo" — re-inserts card with layout animation |
| Card removal on unfavorite | Exit animation | Motion + AnimatePresence | `exit={{ opacity: 0, scale: 0.95 }}` with `AnimatePresence` wrapping the grid |
| Empty state entrance | Fade-in | Motion | `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` |
| Drag to reorder (stretch) | Drag with layout | Motion | `drag` prop + `layout` on each card — reorder fires spring physics on siblings |

### 5.5 Dashboard

| Element | Interaction | Engine | Spec |
|---------|-------------|--------|------|
| Stat tiles | Hover lift | Tailwind | `hover:-translate-y-1 hover:shadow-md transition-all duration-200` |
| Stat tile number | Count-up on mount | Motion | `useMotionValue(0)` + `useAnimate` — each tile animates its metric from 0 |
| Listing manager rows | Hover highlight | Tailwind | `hover:bg-muted/50 transition-colors duration-150` |
| Quick links | Hover + press | Tailwind | `hover:bg-accent active:scale-[0.98] transition-all duration-150` |
| Sidebar nav (if present) | Active indicator slide | Motion | `layoutId="nav-active"` — blue pill slides to active nav item with spring |

### 5.6 Search

| Element | Interaction | Engine | Spec |
|---------|-------------|--------|------|
| Debounced search input | Focus ring + subtle scale | Tailwind | `focus-visible:scale-[1.01] focus-visible:ring-2 transition-all duration-150` |
| Filter sheet open | Slide-in from right | Radix Sheet | Built-in `data-[state=open]:animate-in slide-in-from-right` |
| Filter chips (active filter) | Pop on add | Motion | `initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}` spring stiffness 400 |
| Loading state | Skeleton shimmer | Tailwind | `animate-pulse` on skeleton placeholders — but replace with `animate-shimmer` (custom gradient) for a more polished feel |
| Results grid update | Crossfade / stagger | Motion + AnimatePresence | `AnimatePresence mode="popLayout"` on the grid — cards enter with stagger delay = index × 50ms |
| Empty results | Illustration entrance | Motion | `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}` |

### 5.7 Auth Pages (Login / Register / Forgot / Reset)

| Element | Interaction | Engine | Spec |
|---------|-------------|--------|------|
| Form field focus | Border color + ring | Tailwind | `focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-all duration-150` |
| Submit button | Loading spinner swap | Tailwind | `disabled:opacity-70 disabled:cursor-not-allowed` + spinner `animate-spin` (only on submit) |
| Submit button press | Press feedback | Tailwind | `active:scale-[0.97]` |
| Success checkmark | Draw-in | Motion | SVG `pathLength` animation: `animate={{ pathLength: 1 }}` over 400ms |
| Error shake | Shake on invalid | Motion | `animate={{ x: [0, -8, 8, -8, 8, 0] }} transition={{ duration: 0.4 }}` |
| Password reveal toggle | Icon swap | Tailwind | `transition-opacity duration-150` on icon switch |
| Password strength meter | Width grow | Motion | `animate={{ width: percent + "%" }}` spring stiffness 300 — color transitions via conditional classes |
| Form entrance | Fade-up | Motion | `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}` |
| Brand mark (logo/illustration) | Subtle float (optional) | Motion | `animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}` |

### 5.8 Seller Public Profile

| Element | Interaction | Engine | Spec |
|---------|-------------|--------|------|
| Identity tile | Hover lift | Tailwind | `hover:-translate-y-0.5 transition-transform duration-200` |
| Verified badge | Tooltip on hover | Radix Tooltip | Built-in fade-scale, delay 200ms |
| Review cards | Entrance stagger | Motion | `whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 16 }} viewport={{ once: true }}` |
| Active listing cards | Hover lift + image zoom | Tailwind | Combined card + image hover (see Listing Card spec) |
| "Contact seller" button | Hover + press | Tailwind | Same as Make Offer button pattern |
| Tab switching (About / Reviews / Listings) | Underline slide | Motion | `layoutId="profile-tab-active"` — blue underline slides between tabs |

### 5.9 Own Profile

| Element | Interaction | Engine | Spec |
|---------|-------------|--------|------|
| Identity sidebar | Sticky + subtle shadow on scroll | Tailwind | `sticky top-20` + conditional `shadow-md` on scroll via `useScroll` |
| Verification cards | Hover lift | Tailwind | `hover:-translate-y-1 hover:shadow-md transition-all duration-200` |
| Verification progress bar | Width grow on data load | Motion | `animate={{ width: percent + "%" }}` spring — color shifts green as progress increases |
| Edit button | Hover + press | Tailwind | Standard button pattern |
| Avatar upload | Drag-over highlight | Tailwind | `data-[drag-over=true]:border-blue-600 data-[drag-over=true]:bg-blue-50 transition-colors` |

### 5.10 Notifications

| Element | Interaction | Engine | Spec |
|---------|-------------|--------|------|
| Notification row | Unread indicator pulse | Motion | Blue dot `animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}` — only on unread |
| Notification row | Hover highlight | Tailwind | `hover:bg-muted/50 transition-colors duration-150` |
| Type filter chips | Active state pop | Motion | Same as search filter chips |
| Mark as read | Fade out | Motion | `animate={{ opacity: 0.5 }}` tween 200ms |
| New notification (real-time) | Slide-in toast | Radix Toast | Built-in slide-in from top-right |
| Empty state | Illustration entrance | Motion | Same as search empty state |

### 5.11 Offers (Buyer / Seller)

| Element | Interaction | Engine | Spec |
|---------|-------------|--------|------|
| Offer card | Hover lift | Tailwind | Standard card hover pattern |
| Accept / Reject buttons | Hover + press | Tailwind | Accept: `hover:bg-green-600 active:scale-95` · Reject: `hover:bg-red-600 active:scale-95` |
| Offer status change | Badge color transition | Tailwind | `transition-colors duration-200` on status badge |
| Counter-offer input | Focus expand | Tailwind | `focus-within:scale-[1.01] transition-transform duration-150` |
| Offer action confirmation | Success checkmark | Motion | Same as auth success — SVG path draw-in |
| Offer list reorder | Layout animation | Motion | `layout` prop on cards — accepted offer slides to top with spring |

### 5.12 Reports

| Element | Interaction | Engine | Spec |
|---------|-------------|--------|------|
| Summary strip numbers | Count-up on mount | Motion | Same as dashboard stat tiles |
| Report row | Hover highlight | Tailwind | Standard row hover |
| Status badge | Color transition | Tailwind | `transition-colors duration-200` |
| Filter dropdown | Radix Dropdown | Radix | Built-in fade-scale animation |
| Report detail expand | Height animation | Motion | `animate={{ height: "auto" }}` with `overflow: hidden` — spring stiffness 300 |

### 5.13 Pricing

| Element | Interaction | Engine | Spec |
|---------|-------------|--------|------|
| Plan cards | Hover lift + border highlight | Tailwind | `hover:-translate-y-2 hover:border-blue-600 hover:shadow-xl transition-all duration-200` |
| Popular plan badge | Subtle pulse | Motion | `animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.5, repeat: Infinity }}` — only on featured plan |
| FAQ accordion | Height expand | Radix Accordion | Built-in `data-[state=open]:animate-accordion-down` |
| Toggle (monthly/annual) | Switch slide | Radix Toggle | Built-in thumb slide |
| Annual savings badge | Pop on toggle | Motion | `initial={{ scale: 0 }} animate={{ scale: 1 }}` spring stiffness 500 |
| CTA button | Hover + press | Tailwind | Standard button pattern |

---

## 6. Cross-Cutting Patterns

### 6.1 The Hover Lift (most common)

```tsx
// Tailwind — use on every card, tile, clickable surface
<div className="rounded-xl border bg-card shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg">
```

**Why it works:** The 1px upward shift + shadow increase signals "this is clickable, it will respond to you." It's the single highest-ROI micro-interaction in e-commerce. eBay, Mercari, and Etsy all use variants of this.

### 6.2 The Press Feedback

```tsx
// Tailwind — use on every button, interactive element
<button className="active:scale-[0.97] transition-transform duration-100">
```

**Why it works:** Mimics physical button depression. Without it, clicks feel flat and unresponsive. The 0.97 scale is subtle enough to not feel bouncy, strong enough to register.

### 6.3 The Staggered Entrance

```tsx
// Motion — use on any grid/list of cards
<motion.div
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-50px" }}
  transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
/>
```

**Why it works:** Staggered entrances guide the eye through content. Without stagger, a grid of 12 cards appearing simultaneously is overwhelming. With stagger, the eye follows the wave. Keep delay increments small (30–60ms) — beyond 100ms per item, it feels sluggish.

### 6.4 The Optimistic Toggle

```tsx
// React state + Motion — use on favorite, follow, bookmark
const [isFavorite, setIsFavorite] = useState(initial)

const toggle = async () => {
  const previous = isFavorite
  setIsFavorite(!previous) // Optimistic
  try {
    await api.toggleFavorite(id)
  } catch {
    setIsFavorite(previous) // Revert on error
    toast.error("Failed to update favorites")
  }
}
```

**Why it works:** The UI responds instantly, then reconciles with the server. The user never waits for a network round-trip to see feedback. If the request fails, revert + toast.

### 6.5 The Undo Toast

```tsx
// Radix Toast — use on destructive actions (unfavorite, delete, remove)
toast({
  title: "Removed from favorites",
  action: {
    label: "Undo",
    onClick: () => reinsertItem(item),
  },
  duration: 5000,
})
```

**Why it works:** Users are more willing to act when they know they can undo. The 5-second window is long enough to notice, short enough to not linger. Pattern from Gmail, used by eBay and Mercari.

### 6.6 The Shared Layout Transition

```tsx
// Motion — use on image expand (thumbnail → lightbox), card → detail
// Thumbnail:
<motion.img layoutId={`image-${id}`} className="cursor-pointer rounded-lg" />

// Lightbox (rendered in portal):
<motion.div layoutId={`image-${id}`} className="fixed inset-0 z-50" />
```

**Why it works:** The element appears to physically expand from its origin position to fill the viewport. This spatial continuity tells the user "this is the same image, just bigger." It's the most impressive micro-interaction for galleries and product pages.

### 6.7 The Count-Up Number

```tsx
// Motion — use on metrics, prices, ratings
function CountUp({ value }: { value: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString())
  const ref = useRef<HTMLSpanElement>(null)

  useInView(ref, {
    once: true,
    margin: "-50px",
    onEnter: () => animate(count, value, { duration: 1.2, ease: "easeOut" }),
  })

  return <span ref={ref}>{rounded}</span>
}
```

**Why it works:** Numbers that tick from 0 to their final value draw attention and feel alive. Used by Stripe, Vercel, and Airbnb on their marketing pages. Duration 1–1.5s feels substantial without being slow.

### 6.8 The Skeleton Shimmer

```tsx
// Tailwind — use on every loading state
<div className="animate-pulse rounded-lg bg-muted h-48" />

// Or the more polished shimmer:
<div className="relative overflow-hidden rounded-lg bg-muted h-48">
  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
</div>
```

With the custom keyframe in `tailwind.config.ts`:

```tsi
keyframes: {
  shimmer: {
    "100%": { transform: "translateX(100%)" },
  },
},
animation: {
  shimmer: "shimmer 1.5s infinite",
},
```

**Why it works:** Shimmer communicates "content is coming" more effectively than spinners. The directional sweep implies forward progress. Facebook, LinkedIn, and Airbnb all use this pattern.

---

## 7. Performance Rules

### 7.1 Animate only `transform` and `opacity`

These are the only two properties that can be GPU-composited without triggering layout or paint. Never animate `width`, `height`, `top`, `left`, `margin`, `padding`, or `border-width` — they trigger layout recalculation on every frame.

| ✅ Animate | ❌ Don't animate |
|------------|-----------------|
| `transform: translateX()` | `left`, `right` |
| `transform: scale()` | `width`, `height` |
| `transform: rotate()` | `top`, `bottom` |
| `opacity` | `margin`, `padding` |
| `filter: blur()` (use sparingly) | `border-width` |

### 7.2 Use `will-change` sparingly

Apply `will-change-transform` (Tailwind) only to elements about to animate. Remove it after animation completes if the element is static. Overuse causes the browser to allocate GPU memory for layers that don't need it.

### 7.3 Lazy-load Motion for React

Motion for React is tree-shakeable, but if bundle size is a concern, dynamically import heavy animation components:

```tsx
const HeavyAnimatedGallery = dynamic(() => import("./gallery"), {
  loading: () => <GallerySkeleton />,
})
```

### 7.4 Respect `prefers-reduced-motion` for battery

Users with reduced motion preference are often on mobile devices with limited battery. Skipping animations saves CPU/GPU cycles and extends battery life. This is a real, measurable benefit — not just an accessibility checkbox.

### 7.5 Test on low-end devices

An animation that runs at 120fps on a M3 MacBook Pro may drop to 15fps on a $150 Android phone. Test on:
- Chrome DevTools Performance throttling (4x CPU slowdown)
- Lighthouse performance audit
- Physical low-end device if available

---

## 8. Implementation Checklist

### 8.1 Before adding any animation

- [ ] Does it serve a purpose (feedback, guidance, delight) or is it decoration?
- [ ] Is it the cheapest engine that achieves the effect?
- [ ] Does it respect `prefers-reduced-motion`?
- [ ] Is the duration ≤350ms for user-initiated actions?
- [ ] Does it animate only `transform` and `opacity`?
- [ ] Is it tested on a throttled/low-end device?

### 8.2 Before shipping a page

- [ ] Every interactive element has hover + active + focus-visible states
- [ ] Every grid/list has staggered entrance
- [ ] Every destructive action has undo toast
- [ ] Every optimistic toggle has error revert
- [ ] Every loading state has skeleton shimmer
- [ ] Every empty state has illustration + entrance animation
- [ ] Every form has focus states + error feedback
- [ ] `prefers-reduced-motion: reduce` tested and verified

### 8.3 File organization

```
web/src/
├── components/
│   ├── ui/           # shadcn/ui + Radix components (animation built-in)
│   ├── motion/       # Reusable Motion wrappers (MotionCard, MotionGrid, CountUp)
│   └── ...
├── lib/
│   ├── hooks/
│   │   ├── use-prefers-reduced-motion.ts
│   │   └── use-in-view-once.ts
│   └── ...
└── styles/
    └── globals.css   # Custom keyframes (shimmer, accordion, etc.)
```

---

## 9. Recommended Reading & Sources

| Source | Topic |
|--------|-------|
| [Motion for React — Official Docs](https://motion.dev/docs/react) | API reference, spring physics, layout animations |
| [Radix UI — Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) | Built-in component animations |
| [MDN — Using CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations) | CSS animation fundamentals |
| [W3C — SC 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) | WCAG accessibility requirement |
| [Smashing Magazine — Respecting Users' Motion Preferences](https://www.smashingmagazine.com/2021/10/respecting-users-motion-preferences/) | `prefers-reduced-motion` patterns |
| [web.dev — Animations](https://web.dev/explore/animations) | Performance guide for CSS/JS animations |
| [CSS-Tricks — Revisiting prefers-reduced-motion](https://css-tricks.com/revisiting-prefers-reduced-motion/) | Eric Bailey's deep dive |
| [Tatiana Mac — prefers-reduced-motion](https://www.tatianamac.com/posts/prefers-reduced-motion/) | No-motion-first approach |

---

## 10. Summary — The Dagim Gebeya Animation Language

| Principle | Implementation |
|-----------|---------------|
| **Responsive** | Every action gets instant visual feedback (hover, press, focus) |
| **Purposeful** | Every animation serves feedback, guidance, or delight — never decoration alone |
| **Performant** | Only `transform` + `opacity` animated; `will-change` used sparingly |
| **Accessible** | All animations gated behind `prefers-reduced-motion: no-preference` |
| **Consistent** | Same duration/easing vocabulary across all pages |
| **Cheapest engine first** | Tailwind → Radix → Motion for React, in that order |
| **Staggered** | Grid entrances use 30–60ms per-item delay |
| **Optimistic** | Toggles respond instantly, reconcile with server |
| **Recoverable** | Destructive actions offer undo within 5 seconds |
| **Alive** | Springs for physical motion, tweens for visual transitions |

---

*End of document.*
