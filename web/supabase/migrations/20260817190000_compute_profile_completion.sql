-- #82 (audit P1.15): profile_completion was set to 100 once at onboarding and
-- never recomputed, so it read "meaningless 100 forever". PRD FR 112-122
-- defines completion from populated fields (avatar, phone, Telegram, city,
-- bio; 20% each). Replace the stored column with a generated column computed
-- from those fields (trimmed, empty strings count as missing), so every write
-- recomputes it at the DB boundary and no reader can ever see a stale value.
alter table public.profiles drop column profile_completion;

alter table public.profiles
  add column profile_completion smallint not null
    generated always as (
      (
        (coalesce(btrim(avatar_url), '') <> '')::int
        + (coalesce(btrim(phone), '') <> '')::int
        + (coalesce(btrim(telegram_username), '') <> '')::int
        + (coalesce(btrim(city), '') <> '')::int
        + (coalesce(btrim(bio), '') <> '')::int
      ) * 20
    ) stored
    check (profile_completion between 0 and 100);