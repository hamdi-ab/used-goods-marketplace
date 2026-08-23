import type { Metadata } from "next"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your Dagim Gebeya account.",
}

export default async function ResetPasswordPage() {
  return <ResetPasswordForm />
}
