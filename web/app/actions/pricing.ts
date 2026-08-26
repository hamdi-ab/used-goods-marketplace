"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { chapaConfigured, chapaTxRef, initializeChapaTransaction } from "@/lib/chapa"
import { formatEtb } from "@/lib/payments/constants"
import { SITE_URL } from "@/lib/site"

export interface UpgradeIntentState {
  ok?: boolean
  message?: string
  checkoutUrl?: string
}

// #97 — Pro upgrade via Chapa checkout. Pins the 199 ETB/mo price in a pending
// upgrade_intents row, then redirects the seller to Chapa's hosted checkout.
// Chapa not configured (no CHAPA_SECRET_KEY, no demo fallback)? Degrade with a
// safe message instead of offering a broken button.
export async function submitUpgradeIntent(
  _prevState: UpgradeIntentState,
  formData: FormData
): Promise<UpgradeIntentState> {
  const user = await requireUser()
  const supabase = await createClient()

  let email = formData.get("email")?.toString()?.trim() || user.email
  // Chapa rejects non-standard test emails — use their test address for demo accounts
  if (!email || !email.includes("@") || email.endsWith("@vintch.local")) {
    email = "test@chapa.co"
  }

  const txRef = chapaTxRef()
  const money = formatEtb(199)

  const { error: insertErr } = await supabase.from("upgrade_intents").insert({
    user_id: user.id,
    email,
    tier: "pro",
    tx_ref: txRef,
    amount: money.amount,
  })
  if (insertErr) {
    console.error("submitUpgradeIntent insert:", insertErr.message)
    return { ok: false, message: "Could not start the upgrade — please try again later." }
  }

  if (!chapaConfigured()) {
    revalidatePath("/pricing")
    return {
      ok: true,
      message: "We'll notify you when billing opens — no charge today.",
    }
  }

  const returnUrl = `${SITE_URL}/upgrade/callback?tx_ref=${encodeURIComponent(txRef)}`

  const init = await initializeChapaTransaction({
    txRef,
    amount: money.amount,
    currency: money.currency,
    email,
    firstName: user.fullName ?? "Customer",
    returnUrl,
    title: "VinTech",
    description: "Pro tier 199 ETB",
  })

  if (!init.ok) {
    console.error("[Chapa init] error:", init.error)
    return { ok: false, message: "Could not start the upgrade — please try again later." }
  }

  revalidatePath("/pricing")
  return { ok: true, checkoutUrl: init.checkoutUrl }
}
