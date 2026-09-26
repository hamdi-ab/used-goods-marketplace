import { describe, it, expect } from "vitest"

import {
  fetchAdminReviewAppeals,
  appealReviewRemoval,
  resolveReviewAppeal,
} from "@/lib/appeals"

describe("appeals lib", () => {
  const builder = (result: unknown): Record<string, unknown> => {
    const b: Record<string, unknown> = {
      select: () => b,
      eq: () => b,
      order: () => b,
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve(result).then(resolve),
    }
    return b
  }
  const db = (from: (table: string) => unknown) => ({ from } as never)

  it("fetchAdminReviewAppeals returns mapped appeals on success", async () => {
    const mockData = [
      {
        id: "a1",
        review_id: "r1",
        reviewer_id: "u1",
        reason: "The review was accurate and not abusive",
        status: "pending",
        admin_note: null,
        created_at: "2026-09-20T00:00:00Z",
        resolved_at: null,
        reviewer: { id: "u1", full_name: "John Doe", avatar_url: null },
        review: {
          id: "r1",
          rating: 4,
          comment: "Good condition",
          deleted_reason: "Reported as violation",
          deleted_at: "2026-09-19T00:00:00Z",
          seller: [{ id: "s1", full_name: "Jane Seller" }],
          offer: [{ listing: [{ id: "l1", title: "Vintage Camera" }] }],
        },
      },
    ]

    const client = db(() => builder({ data: mockData, error: null }))
    const appeals = await fetchAdminReviewAppeals(client)

    expect(appeals).toHaveLength(1)
    expect(appeals[0].id).toBe("a1")
    expect(appeals[0].reviewer?.full_name).toBe("John Doe")
    expect(appeals[0].review?.comment).toBe("Good condition")
    expect(appeals[0].review?.seller?.full_name).toBe("Jane Seller")
    expect(appeals[0].review?.listing?.title).toBe("Vintage Camera")
  })

  it("fetchAdminReviewAppeals returns empty array on error", async () => {
    const client = db(() =>
      builder({ data: null, error: { message: "db connection failed" } })
    )
    const appeals = await fetchAdminReviewAppeals(client)
    expect(appeals).toEqual([])
  })

  it("exports appealReviewRemoval and resolveReviewAppeal functions", () => {
    expect(typeof appealReviewRemoval).toBe("function")
    expect(typeof resolveReviewAppeal).toBe("function")
  })
})
