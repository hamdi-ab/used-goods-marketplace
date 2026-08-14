import { describe, it, expect } from "vitest"

import {
  CONTACT_METHODS,
  CONTACT_METHOD_LABELS,
  type ContactMethod,
} from "@/lib/contact/constants"

describe("contact methods", () => {
  it("declares telegram and phone", () => {
    expect(CONTACT_METHODS).toEqual(["telegram", "phone"])
  })

  it("maps a label to every declared method", () => {
    for (const method of CONTACT_METHODS) {
      expect(CONTACT_METHOD_LABELS[method]).toBeTruthy()
    }
  })

  it("does not add labels for undeclared methods", () => {
    const declared = new Set<string>(CONTACT_METHODS)
    const labeled = Object.keys(CONTACT_METHOD_LABELS) as ContactMethod[]
    expect(labeled.every((m) => declared.has(m))).toBe(true)
  })
})
