-- Withdrawals: seller payout requests against confirmed earnings.
--
-- The marketplace holds funds after buyer confirmation (48-72h clearance is a
-- business rule enforced in application code, not the DB). Sellers request
-- withdrawals of available balance; each request is a row here tracking the
-- amount, fee, status, and payout destination. The platform deducts a 5%
-- commission at earnings-calculation time (see SellerEarningsCard), not here.

create type public.withdrawal_status as enum ('pending', 'processing', 'completed', 'failed');

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  fee numeric(12, 2) not null default 0,
  net_amount numeric(12, 2) not null,
  currency text not null default 'ETB',
  status public.withdrawal_status not null default 'pending',
  payout_method text not null default 'bank_transfer'
    check (payout_method in ('bank_transfer', 'mobile_money')),
  payout_details jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.withdrawals
  add constraint withdrawals_currency_etb
  check (currency = 'ETB');

create index if not exists withdrawals_seller_id_idx on public.withdrawals (seller_id);
create index if not exists withdrawals_status_idx on public.withdrawals (status);

create trigger withdrawals_set_updated_at
  before update on public.withdrawals
  for each row execute function public.handle_updated_at();

--------------------------------------------------------------------------------
-- RLS: sellers read their own withdrawals; admins manage all.
--------------------------------------------------------------------------------
alter table public.withdrawals enable row level security;

create policy "Withdrawals are readable by the seller"
  on public.withdrawals for select
  to authenticated
  using (
    (select auth.uid()) = seller_id
    or public.is_admin()
  );

create policy "Withdrawals are manageable by admins"
  on public.withdrawals for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

--------------------------------------------------------------------------------
-- request_withdrawal: seller requests a payout of available earnings.
--
-- Deducts the withdrawal fee if the seller has exhausted their free monthly
-- withdrawals. The amount is held in a pending withdrawal row until processed
-- by the platform (manual or automated via Chapa Transfer API).
--------------------------------------------------------------------------------
create or replace function public.request_withdrawal(
  p_seller_id uuid,
  p_amount numeric,
  p_payout_method text default 'bank_transfer',
  p_payout_details jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_free_withdrawals constant integer := 2;
  v_withdrawal_fee constant numeric := 5;
  v_minimum constant numeric := 50;
  v_used_this_month integer;
  v_fee numeric;
  v_net numeric;
  v_id uuid;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  if not (public.is_admin() or (select auth.uid()) = p_seller_id) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if p_amount is null or p_amount < v_minimum then
    return jsonb_build_object('ok', false, 'error', 'minimum withdrawal is 50 ETB');
  end if;

  -- Count all withdrawals this month to determine fee (including failed)
  select count(*) into v_used_this_month
  from public.withdrawals
  where seller_id = p_seller_id
    and created_at >= date_trunc('month', now());

  if v_used_this_month >= v_free_withdrawals then
    v_fee := v_withdrawal_fee;
  else
    v_fee := 0;
  end if;

  v_net := p_amount - v_fee;
  if v_net <= 0 then
    return jsonb_build_object('ok', false, 'error', 'fee exceeds withdrawal amount');
  end if;

  insert into public.withdrawals (
    seller_id, amount, fee, net_amount, currency, payout_method, payout_details
  ) values (
    p_seller_id, p_amount, v_fee, v_net, 'ETB', p_payout_method, p_payout_details
  ) returning id into v_id;

  return jsonb_build_object('ok', true, 'error', null, 'id', v_id, 'fee', v_fee, 'netAmount', v_net);
end;
$$;

grant select on public.withdrawals to authenticated;
revoke all on function public.request_withdrawal(uuid, numeric, text, jsonb) from public;
grant execute on function public.request_withdrawal(uuid, numeric, text, jsonb) to authenticated;
