# VinTech Design System (VDS)

# Part 5 — Governance & Design QA

> Version: 1.0

# Table of Contents

1. Governance
2. Design File Organization
3. Component Lifecycle
4. Design Review Process
5. Developer Handoff
6. Versioning
7. Contribution Guidelines
8. External Design Skills — How to Combine
9. Design QA Checklist
10. Future Evolution
11. Final Principles

# 1. Governance

The Design System is the single source of truth for all UI decisions.

No new component should be introduced without reviewing whether an existing one can be reused.

# 2. Figma Organization

Recommended Structure

```text
📁 Foundations
    Colors
    Typography
    Spacing
    Icons

📁 Components
    Buttons
    Inputs
    Cards
    Navigation

📁 Patterns
    Forms
    Search
    Marketplace
    Dashboards

📁 Templates
    Mobile
    Desktop

📁 Screens
    Authentication
    Marketplace
    Seller Dashboard
    Admin
```

# 3. Component Lifecycle

Every component progresses through these stages.

Draft → Review → Approved → Implemented → Released → Deprecated (if necessary)

# 4. Design Review

Every feature should be reviewed for:

- Visual consistency
- Accessibility
- Responsiveness
- Performance implications
- Trust indicators
- Localization readiness
- Design token usage

# 5. Developer Handoff

Every completed design should include:

- Component names
- Spacing values
- Typography tokens
- Color tokens
- Interaction notes
- Responsive behavior
- Accessibility notes
- Acceptance criteria

No visual measurement should require manual guessing.

# 6. Versioning

Example

VDS v1.0 → v1.1 → v1.2 → v2.0

Breaking changes require a major version.

# 7. Contribution Rules

Before adding a new component ask:

- Can an existing component solve this problem?
- Can it be extended?
- Will it remain reusable?
- Does it align with our principles?

If not, propose a new component with documentation.

# 8. External Design Skills — How to Combine

Three sources inform UI work. This is the agreed division of labor; it prevents the skills from colliding with the design system.

## Roles

| Source | Role | When to use |
|---|---|---|
| **This design system (VDS/VCL/VUX)** | **Source of truth** | Always. Tokens, components, UX principles, and market specifics (ETB, Addis Ababa, Amharic roadmap, trust-first flows) are binding. Nothing ships that contradicts it. |
| **ui-ux-pro-max** | **Reference shelf** | Choosing styles, palettes, fonts, or patterns; broad UX rules; platform/stack guidance (`--stack nextjs`, `--stack shadcn`). Look it up, then check against VDS. |
| **impeccable** | **Polish & audit gate** | Making a finished screen feel non-AI / production-grade. `critique`, `audit`, `polish`, and its anti-slop bans. Runs best on a live app (needs PRODUCT.md / browser). |

## Verified behavior of the tools against our product

The tool engines were actually run against "used goods marketplace, Ethiopia, trust" and compared to this system (August 2026):

- **ui-ux-pro-max `--design-system`** recommends a **Vibrant & Block-based** style with **purple primary (`#7C3AED`) + green accent**, even with "trust"/"clean/practical" keywords. Its typography flip-flops between hand-drawn (Kalam/Patrick Hand) and e-commerce (Rubik/Nunito Sans). **Verdict:** its default color/font output conflicts with our trust-first identity (`#2563EB` primary, Geist). Use it for its *process* (search → reasoning → checklist), not its literal palette/type recommendations. Treat any tool-generated palette as a starting sketch to be reconciled to VDS tokens, not adopted.
- Its **pattern guidance is sound** and matches our UX doc: hero = search-focused CTA, categories, featured listings, trust/safety section, and a "list your item" CTA.
- Its **stack guidance is correct for us**: `next/link` for internal nav, `scroll={false}` for tabs/pagination, `@next/bundle-analyzer`; shadcn `asChild` composition, install via CLI, rely on built-in ARIA.
- Its **UX domain** aligns with our search product: autocomplete + "no results" with suggestions.
- **impeccable** refuses to run without product context (`PRODUCT.md`); it is a polish/craft workflow for a built app, not a doc-time validator. Its **anti-slop bans** (gradient text, side-stripe borders, cream/sand bodies, hero-metric blocks, identical card grids, uppercase eyebrow kickers, numbered section markers) are worth adopting as a manual review gate during implementation.

## Working rule

Build to VDS tokens. When unsure what a screen should look like, consult ui-ux-pro-max as reference, then reconcile to VDS. Before shipping a screen, run an impeccable-style anti-slop + heuristic pass (Nielsen heuristics, cognitive load, personas). A tool's palette, font, or layout is a suggestion; VDS tokens and market specifics are the law.

# 9. Design QA Checklist

## Foundations

- [ ] Uses approved colors
- [ ] Uses typography tokens
- [ ] Uses spacing system
- [ ] Uses elevation tokens

## Accessibility

- [ ] Keyboard accessible
- [ ] Focus visible
- [ ] Color contrast passes WCAG AA
- [ ] Touch targets ≥44×44px

## Responsive

- [ ] Mobile
- [ ] Tablet
- [ ] Desktop

## States

- [ ] Default
- [ ] Hover
- [ ] Focus
- [ ] Disabled
- [ ] Loading
- [ ] Error
- [ ] Empty

## Marketplace Standards

- [ ] Trust indicators shown
- [ ] Seller information visible
- [ ] Price prominent
- [ ] Condition clearly displayed
- [ ] Location displayed
- [ ] Primary action obvious

## Performance

- [ ] Lazy loading considered
- [ ] Image optimization planned
- [ ] Minimal layout shift
- [ ] Efficient rendering

# 10. Future Evolution

Future additions may include:

- Native mobile design system
- Motion library
- Advanced charts
- Design token automation
- Multi-brand support
- Full dark mode
- RTL support

# 11. Final Principles

Every screen should answer:

- What can I do?
- Where am I?
- What happens next?
- Can I trust this?
- Can I complete my task quickly?

If the answer to any question is unclear, the design should be revised.

# Closing Statement

The VinTech Design System is more than a visual guide—it is the shared language between design, engineering, product, and quality assurance. By following its principles, tokens, patterns, and governance rules, the team can deliver a marketplace that feels cohesive, trustworthy, accessible, and scalable from the first release onward.