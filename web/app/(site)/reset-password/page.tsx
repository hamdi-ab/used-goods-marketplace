import type { Metadata } from "next"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your VinTech Marketplace account.",
}

const VARIANT_KEYS = ["A", "B"] as const
type VariantKey = (typeof VARIANT_KEYS)[number]

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>
}) {
  const { variant } = await searchParams
  const key = VARIANT_KEYS.includes(variant as VariantKey)
    ? (variant as VariantKey)
    : undefined
  return <ResetPasswordForm variant={key} />
}