import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/payments", () => ({
  requestWithdrawal: vi.fn(),
  approveWithdrawal: vi.fn(),
  rejectWithdrawal: vi.fn(),
}))
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
}))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { createNotification } from "@/lib/notifications"
import {
  approveWithdrawal,
  rejectWithdrawal,
  requestWithdrawal,
} from "@/lib/payments"
import {
  approveWithdrawalAction,
  rejectWithdrawalAction,
  requestWithdrawalAction,
} from "@/app/actions/payments"

const mockCreateNotification = vi.mocked(createNotification)
const mockRequestWithdrawal = vi.mocked(requestWithdrawal)
const mockApproveWithdrawal = vi.mocked(approveWithdrawal)
const mockRejectWithdrawal = vi.mocked(rejectWithdrawal)

describe("requestWithdrawalAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects invalid amount", async () => {
    const form = new FormData()
    form.append("amount", "not-a-number")
    form.append("accountNumber", "1234567890")
    const result = await requestWithdrawalAction({}, form)
    expect(result.message).toBeDefined()
    expect(result.ok).not.toBe(true)
  })

  it("rejects amount below minimum", async () => {
    mockRequestWithdrawal.mockResolvedValue({
      ok: false,
      error: "Minimum withdrawal is 50 ETB",
    })
    const form = new FormData()
    form.append("amount", "10")
    form.append("accountNumber", "1234567890")
    const result = await requestWithdrawalAction({}, form)
    expect(result.message).toBeDefined()
    expect(result.ok).not.toBe(true)
  })

  it("rejects missing account number", async () => {
    const form = new FormData()
    form.append("amount", "100")
    const result = await requestWithdrawalAction({}, form)
    expect(result.message).toBe("Please enter your account number")
  })

  it("submits valid withdrawal request", async () => {
    mockRequestWithdrawal.mockResolvedValue({
      ok: true,
      id: "withdrawal-1",
      fee: 0,
      netAmount: 100,
    })

    const form = new FormData()
    form.append("amount", "100")
    form.append("accountNumber", "1234567890")
    form.append("payoutMethod", "bank_transfer")

    const result = await requestWithdrawalAction({}, form)
    expect(result.ok).toBe(true)
    expect(result.fee).toBe(0)
    expect(result.netAmount).toBe(100)
  })
})

describe("approveWithdrawalAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects missing withdrawal ID", async () => {
    const form = new FormData()
    const result = await approveWithdrawalAction({}, form)
    expect(result.message).toBe("Invalid request")
  })

  it("approves withdrawal and notifies seller", async () => {
    mockApproveWithdrawal.mockResolvedValue({
      ok: true,
      error: null,
      sellerId: "seller-1",
    })
    mockCreateNotification.mockResolvedValue({ ok: true, error: null })

    const form = new FormData()
    form.append("withdrawalId", "11111111-1111-4111-8111-111111111111")

    const result = await approveWithdrawalAction({}, form)
    expect(result.ok).toBe(true)
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "seller-1",
        type: "withdrawal_approved",
      })
    )
  })
})

describe("rejectWithdrawalAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects withdrawal and notifies seller with reason", async () => {
    mockRejectWithdrawal.mockResolvedValue({
      ok: true,
      error: null,
      sellerId: "seller-1",
    })
    mockCreateNotification.mockResolvedValue({ ok: true, error: null })

    const form = new FormData()
    form.append("withdrawalId", "11111111-1111-4111-8111-111111111111")
    form.append("reason", "Invalid account number")

    const result = await rejectWithdrawalAction({}, form)
    expect(result.ok).toBe(true)
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "seller-1",
        type: "withdrawal_rejected",
        body: expect.stringContaining("Invalid account number"),
      })
    )
  })
})
