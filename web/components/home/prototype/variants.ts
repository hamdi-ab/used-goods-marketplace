export interface PrototypeVariant {
  key: string
  name: string
}

export const PROTOTYPE_VARIANTS: PrototypeVariant[] = [
  { key: "A", name: "Classic hero" },
  { key: "B", name: "Dark editorial" },
]

export const PROTOTYPE_KEYS = PROTOTYPE_VARIANTS.map((v) => v.key)