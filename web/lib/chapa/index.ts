import "server-only"

// Chapa sandbox payment seam (#97). Server-only: the secret key is read from
// env per call and never leaves this module — no client component or action
// ever receives it. The researched flow (initialize -> hosted checkout ->
// verify, test cards, caveats) is captured in #97 and in
// docs/agents/research/chapa-sandbox-payments.md on the research/chapa-sandbox
// branch.
//
// Demo fallback (#97 AC): with CHAPA_DEMO_FALLBACK=true the initialize step
// short-circuits straight to the return URL and verify simulates a success, so
// the full state machine can be shown to judges with no network or account.
// Simulation is gated on the env flag too: a `demo_` tx_ref only simulates
// while the fallback is on, and never hits the real API either way.

const CHAPA_BASE_URL = "https://api.chapa.co/v1"
const CHAPA_TIMEOUT_MS = 15_000
const DEMO_TX_PREFIX = "demo_"

export type ChapaInitializeParams = {
  txRef: string
  amount: number
  currency?: string
  email: string
  firstName?: string | null
  lastName?: string | null
  returnUrl: string
}

export type ChapaInitializeResult =
  | { ok: true; checkoutUrl: string; demo: boolean }
  | { ok: false; error: string }

export type ChapaVerifyResult =
  | {
      ok: true
      status: string
      mode: string
      amount: number
      currency: string
      demo: boolean
    }
  | { ok: false; error: string }

export function chapaDemoMode(): boolean {
  return process.env.CHAPA_DEMO_FALLBACK === "true"
}

export function isDemoTxRef(txRef: string): boolean {
  return txRef.startsWith(DEMO_TX_PREFIX)
}

// A payment can only begin when a real key is present or the demo fallback is
// on; without either, the pay action degrades with a safe message.
export function chapaConfigured(): boolean {
  return Boolean(process.env.CHAPA_SECRET_KEY) || chapaDemoMode()
}

export function chapaTxRef(): string {
  return chapaDemoMode()
    ? `${DEMO_TX_PREFIX}${crypto.randomUUID()}`
    : `fm_${crypto.randomUUID()}`
}

/**
 * Start a Chapa transaction and return the hosted checkout URL to redirect the
 * buyer to. Every failure resolves to a safe { ok: false } result so the UI can
 * surface a friendly message; no server-config detail ever leaks (mirrors
 * lib/ai/listings.ts AC-3).
 */
export async function initializeChapaTransaction(
  params: ChapaInitializeParams
): Promise<ChapaInitializeResult> {
  if (chapaDemoMode()) {
    // No network: the "checkout" is the return page itself, which then
    // verifies the demo tx_ref and simulates success.
    return { ok: true, checkoutUrl: params.returnUrl, demo: true }
  }

  const secretKey = process.env.CHAPA_SECRET_KEY
  if (!secretKey) {
    return { ok: false, error: "Chapa is not configured" }
  }

  try {
    const res = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency ?? "ETB",
        email: params.email,
        first_name: params.firstName ?? "",
        last_name: params.lastName ?? "",
        tx_ref: params.txRef,
        return_url: params.returnUrl,
        customization: {
          title: "VinTech Marketplace",
          description: "Payment for your marketplace purchase",
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(CHAPA_TIMEOUT_MS),
    })

    if (!res.ok) {
      return { ok: false, error: "Chapa could not start the payment" }
    }

    const json = (await res.json()) as {
      status?: string
      data?: { checkout_url?: string }
    }
    const checkoutUrl = json.data?.checkout_url
    if (json.status !== "success" || !checkoutUrl) {
      return { ok: false, error: "Chapa could not start the payment" }
    }

    return { ok: true, checkoutUrl, demo: false }
  } catch {
    return { ok: false, error: "Chapa is unreachable right now" }
  }
}

/**
 * Verify a transaction after the buyer returns from the hosted checkout. A
 * `demo_` tx_ref is simulated (with the expected amount/currency so the
 * complete_payment RPC's server-side match still holds) — but only while the
 * demo fallback env flag is on, and never against the real API. A real tx_ref
 * is checked against Chapa. The caller gates fulfillment on status ===
 * "success" AND mode === "test" (AC: test-mode only).
 */
export async function verifyChapaTransaction(
  txRef: string,
  expected: { amount: number; currency: string }
): Promise<ChapaVerifyResult> {
  if (isDemoTxRef(txRef)) {
    if (!chapaDemoMode()) {
      return { ok: false, error: "Simulated payments are disabled" }
    }
    return {
      ok: true,
      status: "success",
      mode: "test",
      amount: expected.amount,
      currency: expected.currency,
      demo: true,
    }
  }

  const secretKey = process.env.CHAPA_SECRET_KEY
  if (!secretKey) {
    return { ok: false, error: "Chapa is not configured" }
  }

  try {
    const res = await fetch(
      `${CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(txRef)}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
        cache: "no-store",
        signal: AbortSignal.timeout(CHAPA_TIMEOUT_MS),
      }
    )

    if (!res.ok) {
      return { ok: false, error: "Chapa could not verify the payment" }
    }

    const json = (await res.json()) as {
      status?: string
      data?: { status?: string; mode?: string; amount?: number; currency?: string }
    }
    const data = json.data ?? {}
    if (json.status !== "success" || !data.status) {
      return { ok: false, error: "Chapa could not verify the payment" }
    }

    return {
      ok: true,
      status: String(data.status),
      mode: String(data.mode ?? ""),
      amount: Number(data.amount ?? 0),
      currency: String(data.currency ?? ""),
      demo: false,
    }
  } catch {
    return { ok: false, error: "Chapa is unreachable right now" }
  }
}
