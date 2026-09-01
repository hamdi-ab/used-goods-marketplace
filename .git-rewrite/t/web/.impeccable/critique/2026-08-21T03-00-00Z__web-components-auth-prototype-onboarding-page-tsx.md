# Critique snapshot — /onboarding (prototype)

> **Project:** VinTech Marketplace  
> **Page:** `web/components/auth/prototype-onboarding-page.tsx`  
> **Status:** fixes applied + committed  

## Good
- "Split Welcome" layout (navy brand panel + form panel), real `getCurrentUser` prefiling full name, `TRUST` evidence list, fieldset groups, `Skip for now` link, and an **accurate** "Preview mode" comment (the Save button is `disabled type="button"`, inputs have no `name`, no form action → genuinely inert).

## Issues found (1) → fixed
1. **[P2] "Save profile" button** — disabled default `h-9` (36px) for the 44px rhythm. → `className="h-11"`.

## Deferred (P3)
- "Skip for now" text link under 44px — text-link convention.
- Form card lacks variant B tint (only the brand panel differs by variant).

## Verify
- `eslint` clean; `tsc` clean.
- SSR `/onboarding?variant=A`: HTTP 200; "Save profile" + `h-11` present in payload.
