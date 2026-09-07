-- #72 (parent #68) - notifications feature (P0.2).
-- PRD FS-013 (in-app notifications), DB spec §14 (notifications table), API
-- spec §14 (GET /notifications, PATCH /notifications/{id} = mark read). Nothing
-- existed: the dashboard's open-offer badge was the only signal. This migration
-- adds the table + DB triggers on the write paths (offers/reviews/reports) so a
-- notification row lands atomically with the event that causes it.
--
-- Types (DB spec: type TEXT; the app's typed labels live in
-- web/lib/notifications/constants.ts):
--   offer_received  -> the listing seller, when an offer is submitted
--   offer_accepted  -> the offering buyer, when their offer is accepted
--   review_received -> the seller, when a buyer reviews a completed sale
--   report_resolved -> the reporter, when an admin closes their report
--
-- Triggers fire on the tables themselves rather than inside the SECURITY
-- DEFINER RPCs, so every future write path (client INSERT included) inherits
-- notifications without touching the functions. The trigger functions are
-- SECURITY DEFINER (table-owner context) so the insert into `notifications`
-- bypasses RLS; the table's own policies only expose a user's own rows.
--
-- In-app channel only (FS-013): email/push are marked Future in the PRD.
-- Realtime delivery is deferred (config.toml realtime is disabled locally); the
-- app polls for new rows, so this migration only needs the table + triggers.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (
    type in ('offer_received', 'offer_accepted', 'review_received', 'report_resolved')
  )
);

-- Lookup paths: the inbox (newest first) and the unread-count badge.
create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, is_read)
  where is_read = false;

--------------------------------------------------------------------------------
-- RLS (DB spec §20 pattern): a user reads and marks read their own
-- notifications. There are no client INSERT/DELETE policies — the triggers are
-- the only writer, so a notification cannot be forged or suppressed.
--------------------------------------------------------------------------------
alter table public.notifications enable row level security;

create policy "Notifications are readable by their owner"
  on public.notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Notifications are updateable by their owner"
  on public.notifications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select, update on public.notifications to authenticated;

--------------------------------------------------------------------------------
-- Trigger 1: offer_received -> the listing seller.
-- A submitted offer means the seller has a live counter/accept decision to
-- make; the amount + listing title make the toast actionable.
--------------------------------------------------------------------------------
create or replace function public.notify_offer_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_listing_title text;
begin
  select seller_id, title into v_seller_id, v_listing_title
  from public.listings
  where id = new.listing_id;

  -- Belt-and-braces: the offers INSERT policy already forbids self-offers.
  if v_seller_id is not null and v_seller_id <> new.buyer_id then
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      v_seller_id,
      'offer_received',
      'New offer received',
      format('A buyer offered %s ETB on "%s".', new.amount, v_listing_title),
      jsonb_build_object(
        'offer_id', new.id,
        'listing_id', new.listing_id,
        'buyer_id', new.buyer_id,
        'amount', new.amount
      )
    );
  end if;
  return new;
end;
$$;

create trigger notifications_offer_received
  after insert on public.offers
  for each row execute function public.notify_offer_received();

--------------------------------------------------------------------------------
-- Trigger 2: offer_accepted -> the offering buyer.
-- Only the status flip to 'accepted' notifies (decline/counter are quiet; the
-- seller already chose to decline/counter, and the buyer sees the live status).
--------------------------------------------------------------------------------
create or replace function public.notify_offer_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_title text;
begin
  if new.status = 'accepted' then
    select title into v_listing_title
    from public.listings
    where id = new.listing_id;

    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      new.buyer_id,
      'offer_accepted',
      'Offer accepted',
      format('Your offer of %s ETB on "%s" was accepted.', new.amount, coalesce(v_listing_title, 'a listing')),
      jsonb_build_object(
        'offer_id', new.id,
        'listing_id', new.listing_id,
        'amount', new.amount
      )
    );
  end if;
  return new;
end;
$$;

create trigger notifications_offer_accepted
  after update on public.offers
  for each row
  when (new.status is distinct from old.status)
  execute function public.notify_offer_accepted();

--------------------------------------------------------------------------------
-- Trigger 3: review_received -> the seller.
-- submit_review inserts atomically with the trust-score recompute, so this
-- trigger only ever sees complete rows.
--------------------------------------------------------------------------------
create or replace function public.notify_review_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, metadata)
  values (
    new.seller_id,
    'review_received',
    'New review',
    format('You received a %s-star review.', new.rating),
    jsonb_build_object(
      'review_id', new.id,
      'offer_id', new.offer_id,
      'rating', new.rating
    )
  );
  return new;
end;
$$;

create trigger notifications_review_received
  after insert on public.reviews
  for each row execute function public.notify_review_received();

--------------------------------------------------------------------------------
-- Trigger 4: report_resolved -> the reporter.
-- Fires only on a terminal status flip (resolved/rejected), so re-opening is
-- impossible and an admin touching the row without a status change stays quiet.
--------------------------------------------------------------------------------
create or replace function public.notify_report_resolved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('resolved', 'rejected') then
    insert into public.notifications (user_id, type, title, body, metadata)
    values (
      new.reporter_id,
      'report_resolved',
      case when new.status = 'rejected' then 'Report reviewed' else 'Report resolved' end,
      case
        when new.status = 'rejected' then 'The marketplace team closed your report without action.'
        else 'The marketplace team reviewed your report and took action.'
      end,
      jsonb_build_object(
        'report_id', new.id,
        'status', new.status
      )
    );
  end if;
  return new;
end;
$$;

create trigger notifications_report_resolved
  after update on public.reports
  for each row
  when (new.status is distinct from old.status)
  execute function public.notify_report_resolved();