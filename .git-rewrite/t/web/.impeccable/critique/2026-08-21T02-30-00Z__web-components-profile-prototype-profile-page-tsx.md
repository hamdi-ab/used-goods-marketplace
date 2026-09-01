# Critique snapshot — /profile (prototype)

> **Project:** VinTech Marketplace  
> **Pages:** `web/components/profile/prototype-profile-page.tsx`, `prototype-profile-content.tsx`  
> **Status:** fixes applied + committed  

## Good
- Real form actions: `useActionState(updateProfile)`, `uploadAvatar`; `fetchOwnProfile` + `fetchMyVerifications`; `VerificationCard`. Two real layout variants (A hero, B sidebar). Field errors + `aria-invalid`. Trust-score badge class + completion strip.

## Issues found (4) → fixed
1. **[P1] "Save changes" submit** — both variant A & B forms: `<Button className="w-fit">` default `h-9` (36px). → `h-11` (primary save CTA).
2. **[P2] "Upload photo"** — `size="sm"` = `h-7` (28px), an interactive control (opens file picker). → `className="h-11"`.
3. **[P2]** stale "View-only during review" comment (form + avatar upload are live). → corrected.

## Verify
- `eslint` clean; `tsc` clean for both files.
- SSR `/profile?variant=A`: HTTP 200; the corrected `h-11` class token is present in the compiled SSR payload (auth-gated form buttons render only with a session).
