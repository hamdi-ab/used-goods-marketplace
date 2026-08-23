-- #97 — Extend upgrade_intents for Chapa checkout. Adds the Chapa tx_ref and
-- the pinned ETB amount so the upgrade flow can redirect to Chapa's hosted
-- checkout and verify on return. Existing rows (email-capture demo) stay valid
-- — both columns are nullable and default null.

alter table public.upgrade_intents
  add column if not exists tx_ref text,
  add column if not exists amount numeric(12, 2),
  add column if not exists consumed_at timestamptz;

comment on column public.upgrade_intents.tx_ref is 'Chapa transaction reference (null for legacy email-capture demo rows).';
comment on column public.upgrade_intents.amount is 'Paid amount in ETB (null for legacy email-capture demo rows).';
