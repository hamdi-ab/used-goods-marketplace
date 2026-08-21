import type { Metadata } from "next"

import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join VinTech Marketplace to buy and sell used goods.",
}

const VARIANT_KEYS = ["A", "B"] as const
type VariantKey = (typeof VARIANT_KEYS)[number]

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>
}) {
  const { variant } = await searchParams
  const key = VARIANT_KEYS.includes(variant as VariantKey)
    ? (variant as VariantKey)
    : undefined
  return <RegisterForm variant={key} />
}