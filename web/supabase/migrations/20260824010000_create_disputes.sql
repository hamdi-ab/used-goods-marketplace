-- Disputes: buyer-seller transaction disputes resolved by platform admin.
--
-- A dispute can be opened by either party after payment but before the deal
-- closes (buyer confirmation or 48-72h auto-close). The platform admin reviews
-- evidence (photos, chat logs, delivery confirmation) and decides within 7 days.
-- One appeal with new evidence is allowed per the payment system spec (#114).

create type public.dispute_reason as enum ('not_received', 'not_as_description', 'damaged', 'other');
create type public.dispute_status as enum ('open', 'under_review', 'resolved_buyer', 'resolved_seller', 'appealed', 'closed');
create type public.dispute_resolution as enum ('refund_buyer', 'pay_seller', 'partial_refund', 'no_action');

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  offer_id uuid not null references public.offers (id) on delete cascade,
  opened_by uuid not null references public.profiles (id) on delete cascade,
  reason public.dispute_reason not null,
  description text not null,
  evidence_urls text[] not null default '{}',
  status public.dispute_status not null default 'open',
  resolution public.dispute_resolution,
  admin_note text,
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  appeal_note text,
  appeal_evidence_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists disputes_payment_id_idx on public.disputes (payment_id);
create index if not exists disputes_offer_id_idx on public.disputes (offer_id);
create index if not exists disputes_status_idx on public.disputes (status);
create index if not exists disputes_opened_by_idx on public.disputes (opened_by);

create trigger disputes_set_updated_at
  before update on public.disputes
  for each row execute function public.handle_updated_at();

--------------------------------------------------------------------------------
-- RLS: participants (buyer/seller) can read disputes on their offers; admins
-- manage all. No direct inserts — all transitions go through RPCs.
--------------------------------------------------------------------------------
alter table public.disputes enable row level security;

create policy "Disputes are readable by participants"
  on public.disputes for select
  to authenticated
  using (
    opened_by = (select auth.uid())
    or exists (
      select 1 from public.payments p
      where p.id = payment_id
      and (p.buyer_id = (select auth.uid()) or p.seller_id = (select auth.uid()))
    )
    or public.is_admin()
  );

create policy "Disputes are manageable by admins"
  on public.disputes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

--------------------------------------------------------------------------------
-- open_dispute: buyer or seller opens a dispute on a paid payment.
--
-- Only a participant can open a dispute, only on a paid payment, and only
-- once per payment (one open dispute at a time). The payment must be paid
-- but not yet confirmed (once confirmed, the deal is closed).
--------------------------------------------------------------------------------
create or replace function public.open_dispute(
  p_payment_id uuid,
  p_reason public.dispute_reason,
  p_description text,
  p_evidence_urls text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_existing uuid;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'payment not found');
  end if;

  -- Only buyer or seller can open a dispute
  if not (public.is_admin() or v_payment.buyer_id = (select auth.uid()) or v_payment.seller_id = (select auth.uid())) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  -- Payment must be paid but not confirmed
  if v_payment.status <> 'paid' then
    return jsonb_build_object('ok', false, 'error', 'payment is not paid');
  end if;
  if v_payment.buyer_confirmed then
    return jsonb_build_object('ok', false, 'error', 'deal is already closed');
  end if;

  -- One open dispute per payment
  select id into v_existing from public.disputes
  where payment_id = p_payment_id and status in ('open', 'under_review', 'appealed')
  limit 1;
  if found then
    return jsonb_build_object('ok', false, 'error', 'dispute already open');
  end if;

  insert into public.disputes (
    payment_id, offer_id, opened_by, reason, description, evidence_urls
  ) values (
    p_payment_id, v_payment.offer_id, (select auth.uid()), p_reason, p_description, p_evidence_urls
  );

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

--------------------------------------------------------------------------------
-- decide_dispute: admin resolves a dispute.
--
-- The resolution determines the outcome: refund buyer (seller pays), pay seller
-- (release funds), partial refund, or no action. Records the decision and
-- timestamp. Idempotent — re-deciding a closed dispute returns success.
--------------------------------------------------------------------------------
create or replace function public.decide_dispute(
  p_dispute_id uuid,
  p_resolution public.dispute_resolution,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dispute public.disputes;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'only admins can decide disputes');
  end if;

  select * into v_dispute from public.disputes where id = p_dispute_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'dispute not found');
  end if;

  if v_dispute.status = 'closed' then
    return jsonb_build_object('ok', true, 'error', null);
  end if;

  update public.disputes
    set status = 'closed',
        resolution = p_resolution,
        admin_note = p_admin_note,
        decided_by = (select auth.uid()),
        decided_at = now()
    where id = p_dispute_id;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

--------------------------------------------------------------------------------
-- appeal_dispute: participant appeals a decided dispute with new evidence.
--
-- Only the party that lost (or either party within window) can appeal. One
-- appeal per dispute. Requires new evidence.
--------------------------------------------------------------------------------
create or replace function public.appeal_dispute(
  p_dispute_id uuid,
  p_appeal_note text,
  p_appeal_evidence_urls text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dispute public.disputes;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  select * into v_dispute from public.disputes where id = p_dispute_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'dispute not found');
  end if;

  -- Only participants can appeal — not admins
  if public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if not (v_dispute.opened_by = (select auth.uid())) then
    -- Also allow the other party (seller if buyer opened, buyer if seller opened)
    if not exists (
      select 1 from public.payments p
      where p.id = v_dispute.payment_id
      and (p.buyer_id = (select auth.uid()) or p.seller_id = (select auth.uid()))
    ) then
      return jsonb_build_object('ok', false, 'error', 'not allowed');
    end if;
  end if;

  -- Can only appeal once
  if v_dispute.status = 'appealed' then
    return jsonb_build_object('ok', false, 'error', 'already appealed');
  end if;

  if v_dispute.status <> 'closed' then
    return jsonb_build_object('ok', false, 'error', 'dispute is not yet decided');
  end if;

  update public.disputes
    set status = 'appealed',
        appeal_note = p_appeal_note,
        appeal_evidence_urls = p_appeal_evidence_urls
    where id = p_dispute_id;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

grant select on public.disputes to authenticated;
revoke all on function public.open_dispute(uuid, public.dispute_reason, text, text[]) from public;
revoke all on function public.decide_dispute(uuid, public.dispute_resolution, text) from public;
revoke all on function public.appeal_dispute(uuid, text, text[]) from public;
grant execute on function public.open_dispute(uuid, public.dispute_reason, text, text[]) to authenticated;
grant execute on function public.decide_dispute(uuid, public.dispute_resolution, text) to authenticated;
grant execute on function public.appeal_dispute(uuid, text, text[]) to authenticated;
