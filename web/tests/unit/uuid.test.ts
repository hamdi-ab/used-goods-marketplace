import { describe, it, expect } from "vitest"

import { isValidUuid, uuidSchema } from "@/lib/uuid"

const SEED_ID = "10000000-0000-0000-0000-000000000002"

describe("uuid.isValidUuid", () => {
  it("accepts a canonical v4 UUID", () => {
    expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true)
  })

  it("accepts the seeded demo ids (version-0 nibbles) the DB stores", () => {
    expect(isValidUuid(SEED_ID)).toBe(true)
  })

  it("rejects a short id", () => {
    expect(isValidUuid("550e8400")).toBe(false)
  })

  it("rejects a UUID with trailing extra characters", () => {
    expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000 extra")).toBe(false)
  })
})

describe("uuid.uuidSchema", () => {
  it("accepts the seeded demo ids that zod v4 .uuid() would reject", () => {
    expect(uuidSchema.safeParse(SEED_ID).success).toBe(true)
  })

  it("accepts a canonical v4 UUID", () => {
    expect(uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000").success).toBe(true)
  })

  it("rejects a non-UUID string", () => {
    const result = uuidSchema.safeParse("not-a-uuid")
    expect(result.success).toBe(false)
  })

  it("rejects a version-0 id missing the canonical hyphens", () => {
    expect(uuidSchema.safeParse(SEED_ID.replace(/-/g, "")).success).toBe(false)
  })
})