-- T25 (parent #54): Business-tier AI generations are uncapped (strat §36). The
-- original record_ai_generation coalesced p_limit to 3, which would have capped
-- Business at the free tier and lost the "uncapped" semantic. Now a null
-- p_limit records the generation without enforcing a ceiling; the used count is
-- still read back so the dashboard meter shows real Business consumption.
-- Supersedes the function body from 20260819010000_create_ai_generations.sql.

create or replace function public.record_ai_generation(
  p_event public.ai_generation_event,
  p_limit integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_used integer;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  select count(*) into v_used
  from public.ai_generations
  where user_id = v_user
    and created_at >= date_trunc('month', now());

  if p_limit is not null then
    if p_limit <= 0 then
      return jsonb_build_object('ok', false, 'error', 'no credit limit configured');
    end if;
    if v_used >= p_limit then
      return jsonb_build_object(
        'ok', false, 'error', 'monthly AI quota reached', 'used', v_used, 'limit', p_limit);
    end if;
  end if;

  insert into public.ai_generations (user_id, event)
  values (v_user, p_event);

  return jsonb_build_object('ok', true, 'error', null, 'used', v_used + 1, 'limit', p_limit);
end;
$$;

revoke all on function public.record_ai_generation(public.ai_generation_event, integer) from public;
grant execute on function public.record_ai_generation(public.ai_generation_event, integer) to authenticated;