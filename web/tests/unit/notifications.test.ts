import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import {
  fetchMyNotifications,
  fetchUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationsRead,
  NOTIFICATION_TYPE_LABELS,
  notificationHref,
  NOTIFICATION_TYPES,
} from "@/lib/notifications"

const mockCreateClient = vi.mocked(createClient)

// Scripted per-table builder: each chained query resolves the next canned
// result, and update payloads are captured so tests can assert the write.
const script = (
  results: unknown[]
): {
  from: () => Record<string, unknown>
  updates: unknown[]
} => {
  const updates: unknown[] = []
  let i = 0
  const from = (): Record<string, unknown> => {
    const b: Record<string, unknown> = {
      select: () => b,
      eq: () => b,
      in: () => b,
      order: () => b,
      limit: () => b,
      update: (values: unknown) => {
        updates.push(values)
        return b
      },
      then: (resolve: (value: unknown) => unknown) => {
        const next = results[i++] ?? { data: null, error: null, count: null }
        return Promise.resolve(next).then(resolve)
      },
    }
    return b
  }
  return { from, updates }
}

describe("notifications constants (#72)", () => {
  it("labels every type and exposes the exact type union", () => {
    expect(NOTIFICATION_TYPES).toEqual([
      "offer_received",
      "offer_accepted",
      "review_received",
      "report_resolved",
    ])
    expect(NOTIFICATION_TYPE_LABELS.offer_received).toBe("New offer")
    expect(NOTIFICATION_TYPE_LABELS.offer_accepted).toBe("Offer accepted")
    expect(NOTIFICATION_TYPE_LABELS.review_received).toBe("New review")
    expect(NOTIFICATION_TYPE_LABELS.report_resolved).toBe("Report reviewed")
  })

  it("maps offer/review events to a deep link and report_resolved to none", () => {
    expect(
      notificationHref("offer_received", { listing_id: "listing-1" })
    ).toBe("/listings/listing-1")
    expect(notificationHref("offer_accepted", {})).toBe("/offers")
    expect(notificationHref("review_received", {})).toBe("/offers")
    expect(notificationHref("report_resolved", {})).toBeNull()
  })
})

describe("notifications lib (#72)", () => {
  it("fetchMyNotifications returns the typed inbox rows", async () => {
    const s = script([
      {
        data: [
          {
            id: "n1",
            type: "offer_received",
            title: "New offer received",
            body: "A buyer offered 100 ETB.",
            is_read: false,
            metadata: { listing_id: "l1" },
            created_at: "2026-08-17T00:00:00Z",
          },
        ],
        error: null,
      },
    ])
    mockCreateClient.mockResolvedValue(s as never)

    const rows = await fetchMyNotifications("user-1")
    expect(rows).toHaveLength(1)
    expect(rows[0].title).toBe("New offer received")
    expect(rows[0].metadata).toEqual({ listing_id: "l1" })
  })

  it("fetchMyNotifications returns [] on a read error", async () => {
    const s = script([{ data: null, error: { message: "db down" } }])
    mockCreateClient.mockResolvedValue(s as never)
    expect(await fetchMyNotifications("user-1")).toEqual([])
  })

  it("fetchUnreadNotificationsCount returns the exact head count", async () => {
    const s = script([{ count: 3, error: null }])
    mockCreateClient.mockResolvedValue(s as never)
    expect(await fetchUnreadNotificationsCount("user-1")).toBe(3)
  })

  it("fetchUnreadNotificationsCount returns 0 on error", async () => {
    const s = script([{ count: null, error: { message: "db down" } }])
    mockCreateClient.mockResolvedValue(s as never)
    expect(await fetchUnreadNotificationsCount("user-1")).toBe(0)
  })

  it("markNotificationsRead is a no-op for an empty selection", async () => {
    mockCreateClient.mockResolvedValue({ from: () => {} } as never)
    expect(await markNotificationsRead("user-1", [])).toEqual({
      ok: true,
      error: null,
    })
  })

  it("markNotificationsRead marks exactly the selected ids", async () => {
    const s = script([{ data: null, error: null }])
    mockCreateClient.mockResolvedValue(s as never)

    const result = await markNotificationsRead("user-1", ["n1", "n2"])
    expect(result).toEqual({ ok: true, error: null })
    expect(s.updates[0]).toEqual({ is_read: true })
  })

  it("markNotificationsRead surfaces a write error", async () => {
    const s = script([{ data: null, error: { message: "db down" } }])
    mockCreateClient.mockResolvedValue(s as never)
    expect(await markNotificationsRead("user-1", ["n1"])).toEqual({
      ok: false,
      error: "db down",
    })
  })

  it("markAllNotificationsRead marks every unread row and surfaces errors", async () => {
    const s = script([{ data: null, error: null }])
    mockCreateClient.mockResolvedValue(s as never)
    expect(await markAllNotificationsRead("user-1")).toEqual({
      ok: true,
      error: null,
    })
    expect(s.updates[0]).toEqual({ is_read: true })

    const failing = script([{ data: null, error: { message: "db down" } }])
    mockCreateClient.mockResolvedValue(failing as never)
    expect(await markAllNotificationsRead("user-1")).toEqual({
      ok: false,
      error: "db down",
    })
  })
})