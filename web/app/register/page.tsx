import type { Metadata } from "next"

import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join VinTech Marketplace to buy and sell used goods.",
}

export default function RegisterPage() {
  return <RegisterForm />
}