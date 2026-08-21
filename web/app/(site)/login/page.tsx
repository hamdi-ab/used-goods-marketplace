import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your VinTech Marketplace account.",
}

const VARIANT_KEYS = ["A", "B"] as const
type VariantKey = (typeof VARIANT_KEYS)[number]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; variant?: string }>
}) {
  const { next, variant } = await searchParams
  const key = VARIANT_KEYS.includes(variant as VariantKey)
    ? (variant as VariantKey)
    : undefined
  return <LoginForm next={next} variant={key} />
}