-- Permit service_role in complete_payment authorization check and grant execute
create or replace function public.complete_payment(
  p_tx_ref text,
  p_mode text,
  p_amount numeric,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
begin
  select * into v_payment from public.payments where tx_ref = p_tx_ref for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'payment not found');
  end if;

  if not (
    public.is_admin() or
    (select auth.role()) = 'service_role' or
    v_payment.buyer_id = (select auth.uid())
  ) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if v_payment.status = 'paid' then
    return jsonb_build_object('ok', true, 'error', null);
  end if;
  if v_payment.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'payment is not pending');
  end if;

  if p_mode <> v_payment.mode then
    return jsonb_build_object('ok', false, 'error', 'mode mismatch');
  end if;
  if p_amount is null or p_amount <> v_payment.amount then
    return jsonb_build_object('ok', false, 'error', 'amount mismatch');
  end if;
  if p_currency is null or upper(p_currency) <> v_payment.currency then
    return jsonb_build_object('ok', false, 'error', 'currency mismatch');
  end if;

  update public.payments
    set status = 'paid', paid_at = now()
    where id = v_payment.id;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

grant execute on function public.complete_payment(text, text, numeric, text) to service_role;
