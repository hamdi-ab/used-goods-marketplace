import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { restoreUserRow, suspendUserRow } from "@/lib/admin"

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