"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { createClient } from "@/lib/supabase/client"
import { isInternalPath } from "@/lib/utils"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthDivider } from "@/components/auth/auth-divider"
import { GoogleButton } from "@/components/auth/google-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginValues) {
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword(values)

    if (error) {
      setError("Invalid email or password.")
      return
    }

    router.refresh()
    router.push(isInternalPath(next) ? next : "/")
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Log in to your Dagim Gebeya account."
      footer={<>Don&apos;t have an account? <Link href="/register" className="font-medium text-primary hover:underline">Sign up</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
          {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
          </div>
          <PasswordInput id="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
          {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
        </div>

        {error ? <p className="text-sm text-destructive shake">{error}</p> : null}

        <Button type="submit" disabled={isSubmitting} className="mt-2 h-11 press-feedback">
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>

        <AuthDivider />

        <GoogleButton>Continue with Google</GoogleButton>
      </form>
    </AuthLayout>
  )
}
