import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import {
  fetchOwnProfile,
  fetchPublicProfile,
  completeOwnProfile,
  updateOwnProfile,
} from "@/lib/profiles"

const mockCreateClient = vi.mocked(createClient)

// Fluent builder that resolves chained queries in order, so the phone gate's
// two-query dance (base read, then phone read) can be stubbed independently.
const queue = (results: unknown[]): Record<string, unknown> => {
  let i = 0
  const b: Record<string, unknown> = {
    select: () => b,
    eq: () => b,
    order: () => b,
    maybeSingle: () => b,
    single: () => b,
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(results[i++] ?? { data: null, error: null }).then(resolve),
  }
  return b
}

const db = (from: (table: string) => unknown) => ({ from } as never)

// Builder for write paths: records the update payload and resolves a canned
// result, so callers can assert exactly what was persisted.
const captureBuilder = (
  result: unknown
): { b: Record<string, unknown>; updates: unknown[] } => {
  const updates: unknown[] = []
  const b: Record<string, unknown> = {
    select: () => b,
    eq: () => b,
    update: (values: unknown) => {
      updates.push(values)
      return b
    },
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  }
  return { b, updates }
}

const ownRow = {
  avatar_url: null,
  full_name: "Alem",
  phone: "+251 911 000 000",
  telegram_username: "alem",
  city: "Bole",
  sub_city: null,
  bio: "Hi",
  trust_score: 50,
  profile_completion: 100,
  role: "seller",
  phone_public: false,
}

describe("profile reads", () => {
  it("fetchOwnProfile returns the row when found", async () => {
    mockCreateClient.mockResolvedValue(
      db(() => queue([{ data: ownRow, error: null }]))
    )
    expect(await fetchOwnProfile("user-own")).toEqual(ownRow)
  })

  it("fetchOwnProfile returns null when the row is missing", async () => {
    mockCreateClient.mockResolvedValue(
      db(() => queue([{ data: null, error: null }]))
    )
    expect(await fetchOwnProfile("user-missing")).toBeNull()
  })

  it("fetchOwnProfile returns null on a database error", async () => {
    mockCreateClient.mockResolvedValue(
      db(() => queue([{ data: null, error: { message: "db down" } }]))
    )
    expect(await fetchOwnProfile("user-error")).toBeNull()
  })

  it("fetchPublicProfile returns null when the profile is missing", async () => {
    mockCreateClient.mockResolvedValue(
      db(() => queue([{ data: null, error: null }]))
    )
    expect(await fetchPublicProfile("user-missing")).toBeNull()
  })

  it("fetchPublicProfile keeps phone private unless phone_public is set", async () => {
    const base = { ...ownRow, phone_public: false, phone: null }
    mockCreateClient.mockResolvedValue(
      db(() => queue([{ data: base, error: null }]))
    )
    const result = await fetchPublicProfile("user-private")
    expect(result?.phone).toBeNull()
    expect(result?.phone_public).toBe(false)
  })

  it("fetchPublicProfile fetches phone in a second query when opted in", async () => {
    const base = { ...ownRow, phone_public: true, phone: null }
    const q = queue([
      { data: base, error: null },
      { data: { phone: "+251 911 999 999" }, error: null },
    ])
    mockCreateClient.mockResolvedValue(db(() => q))
    const result = await fetchPublicProfile("user-public")
    expect(result?.phone).toBe("+251 911 999 999")
  })
})

describe("profile writes", () => {
  it("completeOwnProfile strips the @ from telegram and marks completion 100", async () => {
    const { b, updates } = captureBuilder({ data: null, error: null })
    mockCreateClient.mockResolvedValue(db(() => b))

    const result = await completeOwnProfile("user-1", {
      fullName: "Alem",
      city: "Bole",
      telegramUsername: "@alem",
      bio: "Hi",
    })

    expect(result).toEqual({ ok: true, error: null })
    expect(updates[0]).toMatchObject({
      telegram_username: "alem",
      profile_completion: 100,
      full_name: "Alem",
    })
  })

  it("completeOwnProfile surfaces a database error", async () => {
    const { b } = captureBuilder({ data: null, error: { message: "db down" } })
    mockCreateClient.mockResolvedValue(db(() => b))
    expect(
      await completeOwnProfile("user-1", { fullName: "Alem", city: "Bole" })
    ).toEqual({ ok: false, error: "db down" })
  })

  it("updateOwnProfile persists phone_public", async () => {
    const { b, updates } = captureBuilder({ data: null, error: null })
    mockCreateClient.mockResolvedValue(db(() => b))

    const result = await updateOwnProfile("user-1", {
      city: "Bole",
      phonePublic: true,
    })

    expect(result).toEqual({ ok: true, error: null })
    expect(updates[0]).toMatchObject({ city: "Bole", phone_public: true })
  })
})