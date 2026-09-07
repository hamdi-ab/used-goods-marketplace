import { describe, it, expect, beforeEach } from "vitest"

import {
  recordAiUsage,
  getAiUsageCounters,
  resetAiUsageCounters,
} from "@/lib/ai/telemetry"

beforeEach(() => resetAiUsageCounters())

describe("AI usage telemetry (FS-005 analytics)", () => {
  it("counts each tracked event independently", () => {
    recordAiUsage("ai_used")
    recordAiUsage("ai_used")
    recordAiUsage("ai_regenerated")
    recordAiUsage("ai_accepted")
    expect(getAiUsageCounters()).toEqual({
      ai_used: 2,
      ai_regenerated: 1,
      ai_accepted: 1,
    })
  })

  it("returns a snapshot, not the live counter object", () => {
    recordAiUsage("ai_used")
    const snap = getAiUsageCounters()
    recordAiUsage("ai_used")
    expect(snap.ai_used).toBe(1)
  })

  it("resets to zero", () => {
    recordAiUsage("ai_used")
    resetAiUsageCounters()
    expect(getAiUsageCounters()).toEqual({
      ai_used: 0,
      ai_regenerated: 0,
      ai_accepted: 0,
    })
  })
})
