export interface PrototypeVariant {
  key: string
  name: string
}

export const PROTOTYPE_VARIANTS: PrototypeVariant[] = [
  { key: "A", name: "Badge-led" },
  { key: "B", name: "Score-led" },
  { key: "C", name: "Story-led" },
]

export const PROTOTYPE_KEYS = PROTOTYPE_VARIANTS.map((v) => v.key)

// Shared mock data for the trust prototype. All surfaces render from this so
// the variants differ structurally, never in the underlying data.
export const MOCK = {
  verified: {
    name: "Amira Bekele",
    avatar: "",
    role: "seller",
    phone_verified: true,
    fayda_verified: true,
    trust_score: 70,
    rating: 4.8,
    reviews: 23,
  },
  unverified: {
    name: "Yonas Tadesse",
    avatar: "",
    role: "seller",
    phone_verified: false,
    fayda_verified: false,
    trust_score: 50,
    rating: 0,
    reviews: 0,
  },
  listings: [
    {
      id: "1",
      title: "iPhone 13 — 128GB, like new",
      price: 42000,
      condition: "Used – like new",
      city: "Bole, Addis Ababa",
    },
    {
      id: "2",
      title: "Samsung 55\" 4K TV with stand",
      price: 35500,
      condition: "Used – good",
      city: "Kazanchis, Addis Ababa",
    },
    {
      id: "3",
      title: "Wooden dining table, 6 seats",
      price: 18000,
      condition: "Used – good",
      city: "Piassa, Addis Ababa",
    },
  ],
}