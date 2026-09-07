"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Loader2Icon } from "lucide-react"

import { completeProfile, type CompleteProfileState } from "@/app/actions/profile"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: CompleteProfileState = {}

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

export function OnboardingForm({ fullName }: { fullName: string }) {
  const [state, formAction, pending] = useActionState(completeProfile, initialState)
  const errors = state.errors ?? {}

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
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Full name *</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={fullName}
                autoComplete="name"
                aria-invalid={!!errors.fullName}
              />
              <FieldError message={errors.fullName?.[0]} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  placeholder="e.g. Addis Ababa"
                  aria-invalid={!!errors.city}
                />
                <FieldError message={errors.city?.[0]} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="subCity">Sub-city</Label>
                <Input id="subCity" name="subCity" placeholder="e.g. Bole" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="e.g. +251 91 234 5678"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="telegramUsername">Telegram username</Label>
                <Input
                  id="telegramUsername"
                  name="telegramUsername"
                  placeholder="@yourname"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bio">About you</Label>
              <Input
                id="bio"
                name="bio"
                placeholder="A short introduction (optional)"
              />
              <FieldError message={errors.bio?.[0]} />
            </div>

            {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}

            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save profile"
              )}
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