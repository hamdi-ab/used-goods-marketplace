-- T14 - AI Listing Assistant
-- Records that a listing's title/description/category/condition were applied
-- from AI suggestions (issue #18 AC-5: flag AI-assisted listings). The flag is
-- opt-in — only set when the seller accepts AI suggestions — and is purely
-- informational: AI never publishes automatically (FS-005 / AC-2), and editing
-- a suggested value afterward does not clear the flag (the listing still used
-- AI assistance). Per DB spec §17 (index boolean filter columns).
alter table public.listings
  add column if not exists ai_assisted boolean not null default false;

-- Only published, non-deleted listings are surfaced in browse/search, so only
-- they are worth indexing for an "AI-assisted" scan/filter.
create index if not exists listings_ai_assisted_idx
  on public.listings (ai_assisted)
  where status = 'published' and deleted_at is null;
