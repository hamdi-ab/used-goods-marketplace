export interface PrototypeVariant {
  key: string
  name: string
}

export const PROTOTYPE_VARIANTS: PrototypeVariant[] = [
  { key: "B", name: "Trust-forward marketplace" },
]

export const PROTOTYPE_KEYS = PROTOTYPE_VARIANTS.map((v) => v.key)