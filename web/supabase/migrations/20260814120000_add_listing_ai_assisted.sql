-- T14 - AI Listing Assistant
-- Records that a listing's title/description/category/condition were applied
-- from AI suggestions (issue #18 AC-5: flag AI-assisted listings). The flag is
-- opt-in — only set when the seller accepts AI suggestions — and is purely
-- informational: AI never publishes automatically (FS-005 / AC-2), and editing
-- a suggested value afterward does not clear the flag (the listing still used
-- AI assistance). No index is added: no read path filters on the flag (browse
-- and search surface published listings via their own indexes), so an index
-- here would be speculative.
alter table public.listings
  add column if not exists ai_assisted boolean not null default false;
