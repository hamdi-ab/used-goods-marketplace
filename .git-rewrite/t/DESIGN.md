---
name: Used Goods Marketplace
description: Ethiopia's most trusted marketplace for buying and selling second-hand goods
colors:
  primary: "#2563EB"
  primary-600: "#1D4ED8"
  primary-900: "#172554"
  primary-50: "#EFF6FF"
  primary-foreground: "#FFFFFF"
  background: "#FFFFFF"
  foreground: "#0A0A0A"
  muted: "#F7F7F7"
  muted-foreground: "#8A8A8A"
  border: "#EAEAEA"
  input: "#EAEAEA"
  success: "#22C55E"
  warning: "#F59E0B"
  error: "#EF4444"
  info: "#0EA5E9"
typography:
  display:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "40px"
  "3xl": "48px"
  "4xl": "64px"
  "5xl": "80px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "8px 20px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-600}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "8px 20px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "8px 20px"
    height: "40px"
  button-destructive:
    backgroundColor: "rgba(239,68,68,0.10)"
    textColor: "{colors.error}"
    rounded: "{rounded.lg}"
    padding: "8px 20px"
    height: "40px"
  input-default:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 12px"
  card-default:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: Used Goods Marketplace

## 1. Overview

**Creative North Star: "The Well-Organized Bazaar"**

The marketplace presents itself as a calm, well-organized bazaar: every shelf is labeled, every merchant is vetted, and the price is written on the tag. Surfaces are quiet and tidy so the merchandise — the listings — are the focal point. Density is moderate; information is scannable; nothing shouts. The system feels like a competent, friendly assistant: dependable structure, restrained color, clear labels, and honest statuses.

The aesthetic philosophy is confidence through restraint. Design foundations (docs/04-design) set the vocabulary — an 8-point grid, a minimal blue-and-neutral palette, rounded corners, three elevation levels, and motion that only supports understanding. This system explicitly rejects the messy status quo it replaces: unstructured social classifieds and group feeds with noisy cards, ad-hoc layouts, missing structure, cluttered grids, and copy that reads like a forum post. It also rejects generic template-boilerplate dashboards with no personality.

**Key Characteristics:**
- Restrained blue accent on calm neutral surfaces — the listing is the star
- Structured, scannable, label-first hierarchy
- Trust signals (scores, verification, statuses) always visible, never decorative
- Flat by default, gentle elevation only where hierarchy demands it
- Calm, tidy components with consistent radii and spacing

## 2. Colors

A minimal palette: one trust-blue accent on cool neutral grays, with small semantic accents for state. Color communicates hierarchy, trust, and feedback — never decoration.

### Primary
- **Trust Blue** (#2563EB): the single brand accent. Primary buttons, active navigation, links, selected states, and key trust moments. Use sparingly — its rarity is the point.
- **Midnight Navy** (#172554): the deep end of the blue scale. Brand panels, hero surfaces, and footer; pairs with white text at strong contrast.

### Neutral
- **Paper White** (#FFFFFF): primary surfaces, cards, input backgrounds.
- **Fog** (#F7F7F7): muted fills, section backgrounds, secondary surfaces.
- **Ash** (#EAEAEA): borders and input strokes.
- **Ink** (#0A0A0A): primary text.
- **Stone** (#8A8A8A): secondary/muted text. Use at AA-compliant sizes; prefer Ink for anything that must be read.

### Semantic
- **Verified Green** (#22C55E): verified sellers, positive statuses, successful uploads.
- **Attention Amber** (#F59E0B): pending, drafts, fair condition.
- **Alert Red** (#EF4444): destructive actions, errors, reported content.
- **Signal Sky** (#0EA5E9): informational tips and notifications.

**The One Voice Rule.** Trust Blue is used on at most ~10% of any given screen. Its scarcity is what makes trust moments feel deliberate. Never recolor whole screens blue.

**The No Side-Stripe Rule.** A colored vertical stripe on a row's left edge (border-left greater than 1px) is forbidden as a status indicator. Use a tinted background, a paired icon or dot, and text — color is never the only signal.

## 3. Typography

**Display Font:** Geist Sans (fallback: Inter, system-ui, sans-serif)
**Body Font:** Geist Sans (fallback: Inter, system-ui, sans-serif)
**Label/Mono Font:** Geist Mono (for code/metrics only)

**Character:** A clean, humanist sans pairing that reads technical but warm — dependable and legible at small sizes, confident but not decorative at large sizes.

### Hierarchy
- **Display** (700, 48px, 1.2): page heroes and brand moments only.
- **Headline** (600, 32px, 1.3): page titles.
- **Title** (600, 20px, 1.3): card titles and section headers.
- **Body** (400, 16px, 1.5): default text; keep paragraphs under 70 characters.
- **Body Small** (400, 14px, 1.5): secondary reading, metadata.
- **Label** (500, 14px, 1.5): form labels, list labels, button text.
- **Caption** (400, 12px, 1.5): timestamps, helper text, badges.

**The Label-First Rule.** When a value needs context, the label leads and the value follows ("Price — ETB 4,500"). Never leave a bare number or status without a label.

## 4. Elevation

Flat by default, shadow-lite. Depth comes primarily from tonal layering — muted fills sitting on Paper White — with a small shadow vocabulary reserved for interactive or floating surfaces. Surfaces at rest are flat; shadows appear only where a card separates from its background.

### Shadow Vocabulary
- **Level 0** (none): flat surfaces at rest.
- **Level 1** (`0 1px 2px rgba(0,0,0,.06)`): resting cards.
- **Level 2** (`0 4px 12px rgba(0,0,0,.08)`): dropdowns, popovers.
- **Level 3** (`0 10px 30px rgba(0,0,0,.12)`): dialogs.

**The Flat-By-Default Rule.** Never stack shadows. If a surface doesn't need to float, it gets no shadow — use a border or a muted fill instead.

## 5. Components

Calm and tidy: gently rounded, bordered, quiet surfaces; restrained blue accents; hover states shift backgrounds subtly, never bounce or glow.

### Buttons
- **Shape:** gently rounded (12px; small buttons round down to 8px).
- **Primary:** Trust Blue fill, white text, 8px/20px padding, 40px height. Hover deepens to Primary-600; focus shows a 3px ring/50; active nudges down 1px.
- **Secondary / Outline:** Paper White fill, 1px Ash border, Ink text; hover fills Fog.
- **Ghost:** transparent, Ink text; hover fills Fog.
- **Destructive:** Alert Red at 10% fill with Alert Red text; hover 20% fill. Reserved for archive/delete, never primary.
- **Disabled:** always 50% opacity with a pointer-events ban and a visible "Preview mode" hint in prototypes.

### Chips / Badges
- **Style:** full-radius pills (9999px), Fog fill, Stone text at 12px.
- **State:** status chips pair color with an icon or label — Verified Green fill, Attention Amber fill, or Alert Red fill — never a bare colored dot alone.

### Cards / Containers
- **Corner Style:** 16px radius; inner panels and preview boxes 8–12px.
- **Background:** Paper White with a 1px Ash border; muted cards use Fog with no border.
- **Shadow Strategy:** Level 1 only when the card floats over a contrasting background.
- **Internal Padding:** 24px standard; 16px compact.

### Inputs / Fields
- **Style:** transparent fill, 1px Ash stroke, 12px radius (compact 8px), 32px height.
- **Focus:** border shifts to Trust Blue with a 3px ring at 50%.
- **Error:** border and ring shift to Alert Red.
- **Disabled:** 50% opacity; inert prototype fields carry a muted "Preview mode" hint.

### Navigation
- **Style:** top site header, calm and compact; links are Ink text at 14px medium that hover to Fog, with the active route marked by Trust Blue — never an underline or a colored stripe.
- **Mobile:** collapses to a sheet with the same vocabulary.

## 6. Do's and Don'ts

### Do:
- **Do** use Trust Blue sparingly — primary buttons, active nav, links, and key trust moments only.
- **Do** keep paragraphs under 70 characters and avoid centered body text outside heroes.
- **Do** label every value, price, and status; lead with the label, follow with the value.
- **Do** pair status color with text or an icon — never color alone.
- **Do** keep motion to fade/scale/slide at 150–350ms with ease-out; respect reduced-motion.
- **Do** show real data and real states; in prototypes, mark inert controls with a visible "Preview mode" hint.
- **Do** keep touch targets at least 44×44px with a visible 2px/3px focus ring.

### Don't:
- **Don't** look or feel like messy social classifieds or group feeds — no noisy cards, ad-hoc layouts, missing structure, cluttered grids, or forum-post copy.
- **Don't** use a colored left-edge stripe (border-left > 1px) on rows or cards as a status or emphasis marker.
- **Don't** use off-palette accents, gradients for their own sake, neon colors, or decorative overload.
- **Don't** ship template-boilerplate dashboards with no personality or polish.
- **Don't** use color as the only indicator of status, state, or error.
- **Don't** stack shadows, bounce, flash, or rotate excessively.
- **Don't** write button text that isn't an action ("OK", "Go", "Submit" — name the action).
- **Don't** center paragraphs or set body text smaller than 14px on white surfaces.