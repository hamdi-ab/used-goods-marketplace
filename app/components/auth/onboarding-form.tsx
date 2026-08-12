"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const onboardingSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  city: z.string().min(1, "Enter your city"),
  subCity: z.string().optional(),
  phone: z.string().optional(),
  telegramUsername: z.string().optional(),
  bio: z.string().max(300, "Bio must be 300 characters or fewer").optional(),
})

type OnboardingValues = z.infer<typeof onboardingSchema>

export function OnboardingForm({ fullName }: { fullName: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { fullName, city: "", subCity: "", phone: "", telegramUsername: "", bio: "" },
  })

  async function onSubmit(values: OnboardingValues) {
    setError(null)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError("You must be logged in to save your profile.")
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.fullName,
        city: values.city,
        sub_city: values.subCity || null,
        phone: values.phone || null,
        telegram_username: values.telegramUsername
          ? values.telegramUsername.replace(/^@/, "")
          : null,
        bio: values.bio || null,
        profile_completion: 100,
      })
      .eq("id", user.id)

    if (error) {
      setError(error.message)
      return
    }

    router.refresh()
    router.push("/profile")
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Finish setting up your account</CardTitle>
          <CardDescription>
            Tell buyers and sellers a little about you. You can change these
            details any time from your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Full name *</Label>
              <Input
                id="fullName"
                autoComplete="name"
                aria-invalid={!!errors.fullName}
                {...register("fullName")}
              />
              {errors.fullName ? (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  autoComplete="address-level2"
                  placeholder="e.g. Addis Ababa"
                  aria-invalid={!!errors.city}
                  {...register("city")}
                />
                {errors.city ? (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="subCity">Sub-city</Label>
                <Input
                  id="subCity"
                  placeholder="e.g. Bole"
                  aria-invalid={!!errors.subCity}
                  {...register("subCity")}
                />
                {errors.subCity ? (
                  <p className="text-sm text-destructive">{errors.subCity.message}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="e.g. +251 91 234 5678"
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
                {errors.phone ? (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="telegramUsername">Telegram username</Label>
                <Input
                  id="telegramUsername"
                  placeholder="@yourname"
                  aria-invalid={!!errors.telegramUsername}
                  {...register("telegramUsername")}
                />
                {errors.telegramUsername ? (
                  <p className="text-sm text-destructive">{errors.telegramUsername.message}</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bio">About you</Label>
              <Input
                id="bio"
                placeholder="A short introduction (optional)"
                aria-invalid={!!errors.bio}
                {...register("bio")}
              />
              {errors.bio ? (
                <p className="text-sm text-destructive">{errors.bio.message}</p>
              ) : null}
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">
            Skip for now
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}