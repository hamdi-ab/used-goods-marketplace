import { describe, it, expect } from "vitest"

import {
  computeProfileCompletion,
  PROFILE_COMPLETION_FIELDS,
  type ProfileCompletionInput,
} from "@/lib/profiles/constants"

const empty: ProfileCompletionInput = {
  avatar_url: null,
  phone: null,
  telegram_username: null,
  city: null,
  bio: null,
}

describe("computeProfileCompletion (#82)", () => {
  it("counts five fields at 20% each per PRD FR 112-122", () => {
    expect(PROFILE_COMPLETION_FIELDS).toHaveLength(5)
    expect(computeProfileCompletion(empty)).toBe(0)
    expect(
      computeProfileCompletion({ ...empty, city: "Addis Ababa" })
    ).toBe(20)
    expect(
      computeProfileCompletion({ ...empty, city: "Addis Ababa", phone: "+2511" })
    ).toBe(40)
    expect(
      computeProfileCompletion({
        ...empty,
        avatar_url: "https://x/a.png",
        phone: "+2511",
        telegram_username: "alem",
        city: "Bole",
        bio: "Hi",
      })
    ).toBe(100)
  })

  it("treats blank and whitespace-only values as missing", () => {
    expect(computeProfileCompletion({ ...empty, city: "   " })).toBe(0)
    expect(
      computeProfileCompletion({ ...empty, bio: "", phone: " " })
    ).toBe(0)
  })
})
