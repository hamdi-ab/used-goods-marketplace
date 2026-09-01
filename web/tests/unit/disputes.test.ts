import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
}))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notifications"
import {
  appealDisputeAction,
  decideDisputeAction,
  openDisputeAction,
} from "@/app/actions/disputes"

const mockCreateClient = vi.mocked(createClient)
const mockCreateNotification = vi.mocked(createNotification)

function mockRpcResult(result: unknown) {
  mockCreateClient.mockResolvedValue({
    rpc: vi.fn().mockResolvedValue({ data: result, error: null }),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  } as never)
}

describe("openDisputeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects invalid form data", async () => {
    const form = new FormData()
    form.append("paymentId", "not-a-uuid")
    const result = await openDisputeAction({}, form)
    expect(result.message).toBe("Invalid request")
  })

  it("opens a dispute and notifies admins", async () => {
    mockRpcResult({ ok: true, error: null })
    mockCreateNotification.mockResolvedValue({ ok: true, error: null })

    const form = new FormData()
    form.append("paymentId", "11111111-1111-4111-8111-111111111111")
    form.append("reason", "not_received")
    form.append("description", "Never got the item")

    const result = await openDisputeAction({}, form)
    expect(result.ok).toBe(true)
  })
})

describe("decideDisputeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("notifies both buyer and seller on resolution", async () => {
    mockRpcResult({ ok: true, error: null })
    mockCreateNotification.mockResolvedValue({ ok: true, error: null })

    const form = new FormData()
    form.append("disputeId", "11111111-1111-4111-8111-111111111111")
    form.append("resolution", "refund_buyer")
    form.append("adminNote", "Refund approved for testing")

    // Mock the dispute lookup to get buyer/seller ids
    mockCreateClient.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: { ok: true, error: null }, error: null }),
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          payment: [{ buyer_id: "buyer-1", seller_id: "seller-1" }],
        },
        error: null,
      }),
    } as never)

    const result = await decideDisputeAction({}, form)
    expect(result.ok).toBe(true)
    expect(mockCreateNotification).toHaveBeenCalledTimes(2)
  })
})

describe("appealDisputeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects empty appeal note", async () => {
    const form = new FormData()
    form.append("disputeId", "11111111-1111-4111-8111-111111111111")
    form.append("appealNote", "")
    const result = await appealDisputeAction({}, form)
    expect(result.message).toBe("Invalid request")
  })

  it("submits appeal and notifies admins", async () => {
    mockRpcResult({ ok: true, error: null })
    mockCreateNotification.mockResolvedValue({ ok: true, error: null })

    const form = new FormData()
    form.append("disputeId", "11111111-1111-4111-8111-111111111111")
    form.append("appealNote", "I have new evidence")

    const result = await appealDisputeAction({}, form)
    expect(result.ok).toBe(true)
  })
})
