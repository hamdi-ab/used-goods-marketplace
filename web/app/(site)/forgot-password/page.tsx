import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset for your VinTech Marketplace account.",
}

const VARIANT_KEYS = ["A", "B"] as const
type VariantKey = (typeof VARIANT_KEYS)[number]

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>
}) {
  const { variant } = await searchParams
  const key = VARIANT_KEYS.includes(variant as VariantKey)
    ? (variant as VariantKey)
    : undefined
  return <ForgotPasswordForm variant={key} />
}