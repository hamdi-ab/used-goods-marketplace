"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { createClient } from "@/lib/supabase/client"
import { AuthCard } from "@/components/auth/auth-card"
import { useSignOut } from "@/components/auth/use-sign-out"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const signOut = useSignOut()
  const [loading, setLoading] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data, error }) => {
      setInvalid(!error && !data.user)
      setLoading(false)
    })
  }, [])

  async function onSubmit(values: ResetPasswordValues) {
    setError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({ password: values.password })

    if (error) {
      setError(error.message)
      return
    }

    await signOut("/login")
  }

  if (loading) {
    return <AuthCard title="Reset your password" />
  }

  if (invalid) {
    return (
      <AuthCard
        title="Link invalid or expired"
        description="This password reset link is no longer valid. Request a new one to continue."
        footer={
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Request a new link
          </Link>
        }
      />
    )
  }

  return (
    <AuthCard
      title="Choose a new password"
      description="Enter a new password for your account."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          ) : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </AuthCard>
  )
}