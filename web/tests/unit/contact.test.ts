import { describe, it, expect } from "vitest"

import {
  CONTACT_METHODS,
  CONTACT_METHOD_LABELS,
  isContactMethodAvailable,
  availableContactMethods,
  buildContactUrl,
  type ContactMethod,
  type SellerContactInfo,
} from "@/lib/contact/constants"

const makeInfo = (over: Partial<SellerContactInfo>): SellerContactInfo => ({
  telegram_username: null,
  phone: null,
  phone_public: false,
  ...over,
})

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

describe("isContactMethodAvailable", () => {
  const info = makeInfo({
    telegram_username: "alice",
    phone: "07911 123456",
    phone_public: true,
  })

  it("returns true for telegram when username is set", () => {
    expect(isContactMethodAvailable(info, "telegram")).toBe(true)
  })

  it("returns false for telegram when username is null", () => {
    expect(isContactMethodAvailable(makeInfo({}), "telegram")).toBe(false)
  })

  it("returns true for phone when opted-in and present", () => {
    expect(isContactMethodAvailable(info, "phone")).toBe(true)
  })

  it("returns false for phone when not opted-in", () => {
    const noOptIn = makeInfo({ phone: "07911 123456" })
    expect(isContactMethodAvailable(noOptIn, "phone")).toBe(false)
  })

  it("returns false for phone when opted-in but phone is empty", () => {
    const noPhone = makeInfo({ phone_public: true })
    expect(isContactMethodAvailable(noPhone, "phone")).toBe(false)
  })
})

describe("availableContactMethods", () => {
  it("returns both methods when seller opted in with both", () => {
    const info = makeInfo({
      telegram_username: "bob",
      phone: "07911 654321",
      phone_public: true,
    })
    expect(availableContactMethods(info)).toEqual(["telegram", "phone"])
  })

  it("returns only telegram when phone is private", () => {
    const info = makeInfo({
      telegram_username: "bob",
      phone: "07911 654321",
      phone_public: false,
    })
    expect(availableContactMethods(info)).toEqual(["telegram"])
  })

  it("returns empty array when no methods available", () => {
    expect(availableContactMethods(makeInfo({}))).toEqual([])
  })
})

describe("buildContactUrl", () => {
  it("builds a t.me deep link for telegram", () => {
    const info = makeInfo({ telegram_username: "alice" })
    expect(buildContactUrl("telegram", info)).toBe("https://t.me/alice")
  })

  it("strips non-digits from phone for the tel: scheme", () => {
    const info = makeInfo({ phone: "07911 123 456", phone_public: true })
    expect(buildContactUrl("phone", info)).toBe("tel:07911123456")
  })
})
