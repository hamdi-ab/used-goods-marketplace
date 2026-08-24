import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset for your Dagim Gebeya account.",
}

export default async function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
