import type { Metadata } from "next"

import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join Dagim Gebeya to buy and sell second-hand goods.",
}

export default async function RegisterPage() {
  return <RegisterForm />
}
