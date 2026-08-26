"use client"

import { useActionState, useState } from "react"
import { StoreIcon, ArrowRightIcon, UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { startSelling, type StartSellingState } from "@/app/actions/selling"

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

export function SellerOnboardingCard({ fullName }: { fullName: string | null }) {
  const [state, formAction, pending] = useActionState<StartSellingState, FormData>(
    startSelling,
    {}
  )
  const [city, setCity] = useState("")
  const [name, setName] = useState(fullName ?? "")

  if (state.message && !state.errors) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-green-600">{state.message}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reload the page or continue below to create your listing.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StoreIcon className="size-5 text-primary" />
          Start selling
        </CardTitle>
        <CardDescription>
          Add your name and city to start listing items. You can add more details
          (phone, bio, avatar) later from your profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Full name *</Label>
            <Input
              id="fullName"
              name="fullName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              aria-invalid={!!state.errors?.fullName}
            />
            <FieldError message={state.errors?.fullName?.[0]} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              name="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Addis Ababa"
              aria-invalid={!!state.errors?.city}
            />
            <FieldError message={state.errors?.city?.[0]} />
          </div>

          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "Saving…" : "Continue to list"}
            <ArrowRightIcon className="ml-2 size-4" />
          </Button>
        </form>

        <div className="mt-6 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <UserIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">What&apos;s next?</p>
              <p className="mt-1">
                After this, you can list items right away. We&apos;ll ask for your
                phone and other details when you&apos;re ready to verify your profile.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
