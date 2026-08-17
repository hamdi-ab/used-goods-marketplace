-- #74 (audit P0.4): listings.view_count is seeded 0 and never written by any
-- code path, so the dashboard "Views" stat is always zero. Add a fire-and-
-- forget, batched, idempotent RPC triggered once per listing-detail view.
--
-- Design:
--   * Views land in a buffer table; one INSERT covers the whole batch
--     (p_listing_ids), then view_count is bumped by exactly the rows that were
--     newly inserted (WITH ... RETURNING redirect), so a retry or a React
--     double-mount never inflates the metric.
--   * Idempotency window: one counted view per (viewer, listing) per 5 minutes
--     (DB spec §8 view_count). Anon viewers share viewer_id NULL, so distinct
--     anonymous visitors within the window are under-counted — an accepted
--     tradeoff for a visitor counter with no identity.
--   * The RPC is callable by anon + authenticated (any visitor views a page);
--     the buffer table itself has no client write path (RLS: admins only).
create table if not exists public.listing_view_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  viewer_id uuid references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists listing_view_events_lookup_idx
  on public.listing_view_events (listing_id, viewer_id, viewed_at);

alter table public.listing_view_events enable row level security;

-- Admins may inspect/clean the buffer (mirrors the listings "manageable by
-- admins" policy); everyone else reaches the table only through the RPC below.
create policy "Listing view events are manageable by admins"
  on public.listing_view_events for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.listing_view_events to authenticated;

create or replace function public.record_listing_view(p_listing_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viewer uuid := auth.uid();
begin
  if p_listing_ids is null or array_length(p_listing_ids, 1) = 0 then
    return jsonb_build_object('ok', false, 'error', 'no listing ids');
  end if;

  create temp table _new_listing_views (listing_id uuid) on commit drop;

  -- Insert only listings that exist and were not viewed by this viewer within
  -- the dedupe window; capture exactly what landed so the count update below
  -- cannot double-apply when the caller retries inside the window.
  with new_views as (
    insert into public.listing_view_events (listing_id, viewer_id)
    select distinct x.listing_id, v_viewer
    from unnest(p_listing_ids) as x(listing_id)
    where exists (
      select 1 from public.listings l
      where l.id = x.listing_id
    )
      and not exists (
        select 1 from public.listing_view_events e
        where e.listing_id = x.listing_id
          and e.viewer_id is not distinct from v_viewer
          and e.viewed_at > now() - interval '5 minutes'
      )
    returning listing_id
  )
  insert into _new_listing_views (listing_id)
  select listing_id from new_views;

  update public.listings l
  set view_count = l.view_count + 1
  where l.id in (select listing_id from _new_listing_views);

  return jsonb_build_object(
    'ok', true,
    'error', null,
    'count', (select count(*) from _new_listing_views)
  );
end;
$$;

revoke all on function public.record_listing_view(uuid[]) from public;
grant execute on function public.record_listing_view(uuid[]) to anon, authenticated;