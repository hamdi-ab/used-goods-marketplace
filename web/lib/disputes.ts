import "server-only"

import { createClient } from "@/lib/supabase/server"
import { callOutcomeRpc } from "@/lib/supabase/rpc"

export type DisputeReason = "not_received" | "not_as_description"
export type DisputeStatus = "open" | "under_review" | "resolved_buyer" | "resolved_seller" | "appealed" | "closed"
export type DisputeResolution = "refund_buyer" | "pay_seller"

export interface Dispute {
  id: string
  payment_id: string
  offer_id: string
  opened_by: string
  reason: DisputeReason
  description: string
  evidence_urls: string[]
  status: DisputeStatus
  resolution: DisputeResolution | null
  admin_note: string | null
  decided_by: string | null
  decided_at: string | null
  appeal_note: string | null
  appeal_evidence_urls: string[]
  created_at: string
  updated_at: string
}

export interface DisputeWithRelations extends Dispute {
  payment: {
    id: string
    amount: number
    currency: string
    status: string
    buyer_id: string
    seller_id: string
  }
  offer: {
    id: string
    amount: number
    listing: {
      id: string
      title: string
    } | null
  } | null
  opener: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

const DISPUTE_COLUMNS = `
  id, payment_id, offer_id, opened_by, reason, description, evidence_urls,
  status, resolution, admin_note, decided_by, decided_at, appeal_note,
  appeal_evidence_urls, created_at, updated_at
`

interface RawDisputeRow {
  id: string
  payment_id: string
  offer_id: string
  opened_by: string
  reason: string
  description: string
  evidence_urls: string[]
  status: string
  resolution: string | null
  admin_note: string | null
  decided_by: string | null
  decided_at: string | null
  appeal_note: string | null
  appeal_evidence_urls: string[]
  created_at: string
  updated_at: string
}

interface RawDisputeWithRelations extends RawDisputeRow {
  payment: Array<{
    id: string
    amount: number
    currency: string
    status: string
    buyer_id: string
    seller_id: string
  }>
  offer: Array<{
    id: string
    amount: number
    listing: Array<{
      id: string
      title: string
    }> | null
  }>
  opener: Array<{
    id: string
    full_name: string | null
    avatar_url: string | null
  }> | null
}

export async function fetchAdminDisputes(): Promise<DisputeWithRelations[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("disputes")
    .select(`
      ${DISPUTE_COLUMNS},
      payment:payments(id, amount, currency, status, buyer_id, seller_id),
      offer:offers(id, amount, listing:listings(id, title)),
      opener:profiles!disputes_opened_by_fkey(id, full_name, avatar_url)
    `)
    .in("status", ["open", "under_review", "appealed"])
    .order("created_at", { ascending: true })

  if (error) {
    console.debug("fetchAdminDisputes:", error.message)
    return []
  }

  return (data ?? []).map((row: RawDisputeWithRelations) => ({
    id: row.id,
    payment_id: row.payment_id,
    offer_id: row.offer_id,
    opened_by: row.opened_by,
    reason: row.reason as DisputeReason,
    description: row.description,
    evidence_urls: row.evidence_urls,
    status: row.status as DisputeStatus,
    resolution: row.resolution as DisputeResolution | null,
    admin_note: row.admin_note,
    decided_by: row.decided_by,
    decided_at: row.decided_at,
    appeal_note: row.appeal_note,
    appeal_evidence_urls: row.appeal_evidence_urls,
    created_at: row.created_at,
    updated_at: row.updated_at,
    payment: row.payment?.[0] ?? null,
    offer: row.offer?.[0] ? { ...row.offer[0], listing: row.offer[0].listing?.[0] ?? null } : null,
    opener: row.opener?.[0] ?? null,
  }))
}

export interface OpenDisputeParams {
  paymentId: string
  reason: DisputeReason
  description: string
  evidenceUrls?: string[]
}

export async function openDispute(params: OpenDisputeParams): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient()
  const result = await callOutcomeRpc(supabase, "open_dispute", {
    p_payment_id: params.paymentId,
    p_reason: params.reason,
    p_description: params.description,
    p_evidence_urls: params.evidenceUrls ?? [],
  }, "openDispute")

  return { ok: result.ok === true, error: result.error ?? null }
}

export interface DecideDisputeParams {
  disputeId: string
  resolution: DisputeResolution
  adminNote?: string | null
}

export async function decideDispute(params: DecideDisputeParams): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient()
  const result = await callOutcomeRpc(supabase, "decide_dispute", {
    p_dispute_id: params.disputeId,
    p_resolution: params.resolution,
    p_admin_note: params.adminNote?.trim() || null,
  }, "decideDispute")

  return { ok: result.ok === true, error: result.error ?? null }
}
