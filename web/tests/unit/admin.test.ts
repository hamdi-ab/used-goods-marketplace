import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import {
  fetchAdminListings,
  fetchAdminUsers,
  restoreUserRow,
  suspendUserRow,
} from "@/lib/admin"

const mockCreateClient = vi.mocked(createClient)

// Scripted per-table builder: each chained query for a table resolves the next
// canned result, and update payloads are captured per table so tests can assert
// exactly what was persisted.
const script = (
  resultsByTable: Record<string, unknown[]>
): {
  from: (table: string) => Record<string, unknown>
  updatesByTable: Record<string, unknown[]>
} => {
  const updatesByTable: Record<string, unknown[]> = {}
  const cursor: Record<string, number> = {}
  const from = (table: string): Record<string, unknown> => {
    const b: Record<string, unknown> = {
      select: () => b,
      eq: () => b,
      is: () => b,
      update: (values: unknown) => {
        ;(updatesByTable[table] ??= []).push(values)
        return b
      },
      then: (resolve: (value: unknown) => unknown) => {
        const list = resultsByTable[table] ?? []
        const next = list[cursor[table] ?? 0] ?? { data: null, error: null }
        cursor[table] = (cursor[table] ?? 0) + 1
        return Promise.resolve(next).then(resolve)
      },
    }
    return b
  }
  return { from, updatesByTable }
}

describe("admin suspend / restore (#86)", () => {
  it("suspendUserRow demotes to buyer, marks suspended_at, and archives listings", async () => {
    const s = script({ profiles: [{}], listings: [{}] })
    mockCreateClient.mockResolvedValue(s as never)

    const result = await suspendUserRow("user-1")
    expect(result).toEqual({ ok: true, error: null })
    expect(s.updatesByTable.profiles?.[0]).toMatchObject({
      role: "buyer",
      suspended_at: expect.any(String),
    })
    expect(s.updatesByTable.listings?.[0]).toMatchObject({
      status: "archived",
      deleted_at: expect.any(String),
    })
  })

  it("suspendUserRow surfaces a profile error", async () => {
    const s = script({
      profiles: [{ data: null, error: { message: "db down" } }],
    })
    mockCreateClient.mockResolvedValue(s as never)
    expect(await suspendUserRow("user-1")).toEqual({
      ok: false,
      error: "db down",
    })
  })

  it("restoreUserRow is a no-op for a user who is not suspended", async () => {
    const s = script({
      profiles: [{ data: [{ suspended_at: null }], error: null }],
    })
    mockCreateClient.mockResolvedValue(s as never)
    expect(await restoreUserRow("user-1")).toEqual({ ok: true, error: null })
    expect(s.updatesByTable.profiles ?? []).toHaveLength(0)
  })

  it("restoreUserRow re-instates the seller role and clears suspended_at", async () => {
    const s = script({
      profiles: [
        { data: [{ suspended_at: "2026-08-17T00:00:00Z" }], error: null },
        {},
      ],
    })
    mockCreateClient.mockResolvedValue(s as never)

    const result = await restoreUserRow("user-1")
    expect(result).toEqual({ ok: true, error: null })
    expect(s.updatesByTable.profiles?.[0]).toEqual({
      role: "seller",
      suspended_at: null,
    })
  })

  it("restoreUserRow surfaces a database error", async () => {
    const s = script({
      profiles: [
        { data: [{ suspended_at: "2026-08-17T00:00:00Z" }], error: null },
        { data: null, error: { message: "db down" } },
      ],
    })
    mockCreateClient.mockResolvedValue(s as never)
    expect(await restoreUserRow("user-1")).toEqual({
      ok: false,
      error: "db down",
    })
  })
})

describe("admin read pages (P1.14 #81)", () => {
  // The list fetchers accept an optional client as their last argument (the
  // same injection the listings-reads tests use), so paging logic runs against
  // a lightweight fake without touching the module mock above.
  const builder = (result: unknown): Record<string, unknown> => {
    const b: Record<string, unknown> = {
      select: () => b,
      is: () => b,
      order: () => b,
      range: () => b,
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve(result).then(resolve),
    }
    return b
  }
  const db = (from: (table: string) => unknown) => ({ from } as never)

  describe("fetchAdminUsers", () => {
    it("maps rows and derives hasMore from the server count", async () => {
      const client = db(() =>
        builder({
          data: [
            {
              id: "u1",
              full_name: "Alem",
              role: "seller",
              city: null,
              phone: null,
              telegram_username: null,
              trust_score: 80,
              profile_completion: 60,
              phone_verified: true,
              fayda_verified: false,
              suspended_at: null,
              created_at: "2026-01-01",
            },
          ],
          error: null,
          count: 30,
        })
      )
      const result = await fetchAdminUsers({}, client)
      expect(result.users[0].full_name).toBe("Alem")
      expect(result.count).toBe(30)
      expect(result.hasMore).toBe(true)
    })

    it("returns an empty page when the query fails", async () => {
      const client = db(() =>
        builder({ data: null, error: { message: "db down" }, count: null })
      )
      const result = await fetchAdminUsers({}, client)
      expect(result).toMatchObject({
        users: [],
        hasMore: false,
        error: "db down",
      })
    })
  })

  describe("fetchAdminListings", () => {
    it("maps rows with the seller join and numeric price", async () => {
      const client = db(() =>
        builder({
          data: [
            {
              id: "l1",
              title: "Chair",
              price: "100",
              condition: "Fair",
              status: "published",
              city: "Bole",
              view_count: 3,
              favorite_count: 1,
              sold_to_buyer_id: null,
              created_at: "2026-01-01",
              published_at: "2026-01-01",
              seller: [{ id: "s1", full_name: "Alem" }],
            },
          ],
          error: null,
          count: 1,
        })
      )
      const result = await fetchAdminListings({}, client)
      expect(result.listings[0].title).toBe("Chair")
      expect(result.listings[0].price).toBe(100)
      expect(result.listings[0].seller?.full_name).toBe("Alem")
      expect(result.count).toBe(1)
      expect(result.hasMore).toBe(false)
    })

    it("returns an empty page when the query fails", async () => {
      const client = db(() =>
        builder({ data: null, error: { message: "db down" }, count: null })
      )
      const result = await fetchAdminListings({}, client)
      expect(result).toMatchObject({
        listings: [],
        hasMore: false,
        error: "db down",
      })
    })
  })
})