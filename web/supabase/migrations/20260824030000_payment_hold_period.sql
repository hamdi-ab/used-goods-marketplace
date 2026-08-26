-- Hold period tracking: 48-72h after buyer confirmation before funds available.
--
-- Per the payment system spec, after the buyer confirms receipt, funds are
-- held for 48-72 hours before the seller can withdraw them. This migration
-- adds a hold_expires_at timestamp that is set when the buyer confirms receipt.

alter table public.payments
  add column if not exists hold_expires_at timestamptz;

create index if not exists payments_hold_expires_at_idx on public.payments (hold_expires_at)
  where hold_expires_at is not null;

-- Update confirm_payment_receipt to set hold_expires_at
create or replace function public.confirm_payment_receipt(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
begin
  select * into v_payment from public.payments
  where offer_id = p_offer_id and status = 'paid'
  order by paid_at desc
  limit 1
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no paid payment');
  end if;

  if not (public.is_admin() or v_payment.buyer_id = (select auth.uid())) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if v_payment.buyer_confirmed then
    return jsonb_build_object('ok', true, 'error', null);
  end if;

  -- Hold period: random 48-72 hours to prevent predictability
  update public.payments
    set buyer_confirmed = true,
        confirmed_at = now(),
        hold_expires_at = now() + interval '48 hours' + (random() * interval '24 hours')
    where id = v_payment.id;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- Function to check if hold period has elapsed
create or replace function public.check_hold_released(p_payment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
begin
  select * into v_payment from public.payments where id = p_payment_id;
  if not found then
    return false;
  end if;

  if v_payment.hold_expires_at is null then
    return false;
  end if;

  return v_payment.hold_expires_at <= now();
end;
$$;

revoke all on function public.check_hold_released(uuid) from public;
grant execute on function public.check_hold_released(uuid) to authenticated;
