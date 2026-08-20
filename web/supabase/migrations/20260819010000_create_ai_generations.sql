-- T25 (parent #54, ticket #66) - monthly AI-generation quota ledger.
-- A credit is consumed ONLY on a successful draft (decision #57): the month
-- count is read before the provider call so the §26 limit message can short-
-- circuit, and a write RPC inserts the counting row only on success. The month
-- window is date_trunc('month', now()) server-side, so the cap resets on the 1st
-- with no cron job.

create type public.ai_generation_event as enum ('generate', 'regenerate');

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event public.ai_generation_event not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_generations_user_month_idx
  on public.ai_generations (user_id, date_trunc('month', created_at));

alter table public.ai_generations enable row level security;

-- Owner reads their own usage; admins audit.
create policy "AI generations are readable by the owner"
  on public.ai_generations for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "AI generations are readable by admins"
  on public.ai_generations for select
  to authenticated
  using (public.is_admin());

-- Monthly count for the calling user (calendar-window, no reset job).
create or replace function public.current_ai_generation_count()
returns table (used integer)
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.ai_generations
  where user_id = (select auth.uid())
    and created_at >= date_trunc('month', now());
$$;

-- Atomically consume a credit if the monthly cap is not yet reached.
-- Called only after a successful draft, so a failed/degraded attempt consumes
-- nothing. Re-checks the cap at insert time (defense in depth against the
-- check-before-provider TOCTOU).
create or replace function public.record_ai_generation(
  p_event public.ai_generation_event,
  p_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_limit integer := coalesce(p_limit, 3);
  v_used integer;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;
  if v_limit <= 0 then
    return jsonb_build_object('ok', false, 'error', 'no credit limit configured');
  end if;

  select count(*) into v_used
  from public.ai_generations
  where user_id = v_user
    and created_at >= date_trunc('month', now());

  if v_used >= v_limit then
    return jsonb_build_object(
      'ok', false, 'error', 'monthly AI quota reached', 'used', v_used, 'limit', v_limit);
  end if;

  insert into public.ai_generations (user_id, event)
  values (v_user, p_event);

  return jsonb_build_object('ok', true, 'error', null, 'used', v_used + 1, 'limit', v_limit);
end;
$$;

revoke all on function public.current_ai_generation_count() from public;
grant execute on function public.current_ai_generation_count() to authenticated;

revoke all on function public.record_ai_generation(public.ai_generation_event, integer) from public;
grant execute on function public.record_ai_generation(public.ai_generation_event, integer) to authenticated;

-- Writes happen only through the SECURITY DEFINER RPC above.
revoke insert on public.ai_generations from authenticated;
grant select on public.ai_generations to authenticated;