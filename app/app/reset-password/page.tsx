import type { Metadata } from "next"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your VinTech Marketplace account.",
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}