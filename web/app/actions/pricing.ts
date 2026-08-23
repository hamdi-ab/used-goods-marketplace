"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { chapaConfigured, chapaTxRef, initializeChapaTransaction } from "@/lib/chapa"
import { etb } from "@/lib/payments/constants"
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
  _formData: FormData
): Promise<UpgradeIntentState> {
  const user = await requireUser()
  const supabase = await createClient()

  if (!chapaConfigured()) {
    return {
      message: "Payments are not set up for this demo yet.",
    }
  }

  const txRef = chapaTxRef()
  const money = etb(199)

  const { error: insertErr } = await supabase.from("upgrade_intents").insert({
    user_id: user.id,
    email: user.email,
    tier: "pro",
    tx_ref: txRef,
    amount: money.amount,
  })
  if (insertErr) {
    console.error("submitUpgradeIntent insert:", insertErr.message)
    return { message: "Could not start the upgrade — please try again later." }
  }

  const returnUrl = `${SITE_URL}/upgrade/callback?tx_ref=${encodeURIComponent(txRef)}`
  const init = await initializeChapaTransaction({
    txRef,
    amount: money.amount,
    currency: money.currency,
    email: user.email,
    firstName: user.fullName,
    returnUrl,
    title: "VinTech Pro",
    description: "Pro tier — 199 ETB/month",
  })

  if (!init.ok) {
    console.error("submitUpgradeIntent chapa:", init.error)
    return { message: "Could not start the upgrade — please try again later." }
  }

  revalidatePath("/pricing")
  return { ok: true, checkoutUrl: init.checkoutUrl }
}
