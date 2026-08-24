import { describe, it, expect, afterEach } from "vitest"

import {
  PAYMENT_CURRENCY,
  PAYMENT_STATUSES,
  paymentPhase,
  pickPayment,
  etb,
  type OfferPayment,
  type PaymentPhase,
} from "@/lib/payments/constants"
import {
  verifyChapaTransaction,
  isDemoTxRef,
} from "@/lib/chapa"

function payment(overrides: Partial<OfferPayment> = {}): OfferPayment {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    amount: 500,
    currency: "ETB",
    status: "pending",
    mode: "test",
    buyer_confirmed: false,
    paid_at: null,
    confirmed_at: null,
    hold_expires_at: null,
    tx_ref: null,
    abandoned_at: null,
    ...overrides,
  }
}

describe("payments status surface", () => {
  it("declares the three statuses", () => {
    expect(PAYMENT_STATUSES).toEqual(["pending", "paid", "failed"])
  })

  it("only ever moves ETB (mirrors the payments_currency_etb check)", () => {
    expect(PAYMENT_CURRENCY).toBe("ETB")
  })

  it("builds Money pairs through the single etb() site", () => {
    expect(etb(500)).toEqual({ amount: 500, currency: "ETB" })
    expect(etb(0.01).currency).toBe(PAYMENT_CURRENCY)
  })
})

describe("payments.pickPayment", () => {
  it("returns null for an empty embed", () => {
    expect(pickPayment(null)).toBeNull()
    expect(pickPayment([])).toBeNull()
  })

  it("prefers a paid row over pending and failed retries", () => {
    const rows = [
      payment({ id: "a", status: "failed" }),
      payment({ id: "b", status: "pending" }),
      payment({ id: "c", status: "paid" }),
    ]
    expect(pickPayment(rows)?.id).toBe("c")
  })

  it("prefers a pending attempt over a failed retry", () => {
    const rows = [
      payment({ id: "a", status: "failed" }),
      payment({ id: "b", status: "pending" }),
    ]
    expect(pickPayment(rows)?.id).toBe("b")
  })

  it("returns a single row unchanged", () => {
    const row = payment({ status: "paid", buyer_confirmed: true })
    expect(pickPayment([row])).toEqual(row)
  })
})

describe("payments.paymentPhase", () => {
  it("treats null, pending, and failed payments as unpaid", () => {
    expect(paymentPhase(null)).toBe("unpaid")
    expect(paymentPhase(payment())).toBe("unpaid")
    expect(paymentPhase(payment({ status: "failed" }))).toBe("unpaid")
  })

  it("is paid until the buyer confirms receipt", () => {
    expect(paymentPhase(payment({ status: "paid" }))).toBe("paid")
  })

  it("is confirmed once the buyer confirms receipt", () => {
    expect(paymentPhase(payment({ status: "paid", buyer_confirmed: true }))).toBe(
      "confirmed"
    )
  })

  it("covers every declared status", () => {
    const phases = new Set<PaymentPhase>([
      paymentPhase(null),
      ...PAYMENT_STATUSES.map((s) => paymentPhase(payment({ status: s }))),
    ])
    expect(phases).toEqual(new Set(["unpaid", "paid"]))
  })
})

describe("chapa.verifyChapaTransaction (demo fallback)", () => {
  afterEach(() => {
    delete process.env.CHAPA_DEMO_FALLBACK
  })

  it("simulates test-mode success for a demo_ tx_ref while the fallback is on", async () => {
    process.env.CHAPA_DEMO_FALLBACK = "true"
    const result = await verifyChapaTransaction("demo_abc", {
      amount: 500,
      currency: "ETB",
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.status).toBe("success")
      expect(result.mode).toBe("test")
      expect(result.amount).toBe(500)
      expect(result.currency).toBe("ETB")
      expect(result.demo).toBe(true)
    }
  })

  it("refuses a simulated tx_ref when the fallback is off", async () => {
    const result = await verifyChapaTransaction("demo_abc", {
      amount: 500,
      currency: "ETB",
    })
    expect(result.ok).toBe(false)
  })

  it("never simulates a non-demo tx_ref", () => {
    expect(isDemoTxRef("demo_1")).toBe(true)
    expect(isDemoTxRef("fm_1")).toBe(false)
  })
})
