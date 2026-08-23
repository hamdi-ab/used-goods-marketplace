"use client"

import { useState } from "react"
import { useActionState } from "react"

import { submitBusinessLead } from "@/app/actions/business-lead"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function BusinessLeadForm() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(submitBusinessLead, {})

  if (state.ok) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="font-medium text-emerald-800">Thanks — we'll be in touch!</p>
        <p className="mt-1 text-sm text-emerald-600">
          A member of our team will reach out within 24 hours to discuss Business tier options.
        </p>
      </div>
    )
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full"
        onClick={() => setOpen(true)}
      >
        Contact sales
      </Button>
    )
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-1.5">
        <Label htmlFor="bl-name" className="text-xs">Name</Label>
        <Input id="bl-name" name="name" required placeholder="Your name" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="bl-email" className="text-xs">Email</Label>
        <Input id="bl-email" name="email" type="email" required placeholder="you@example.com" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="bl-phone" className="text-xs">Phone (optional)</Label>
        <Input id="bl-phone" name="phone" type="tel" placeholder="+251 ..." />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="bl-company" className="text-xs">Business name (optional)</Label>
        <Input id="bl-company" name="company" placeholder="Your shop or company" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="bl-needs" className="text-xs">What do you need? (optional)</Label>
        <Textarea
          id="bl-needs"
          name="needs"
          rows={2}
          placeholder="e.g. Multi-user, storefront, higher limits..."
        />
      </div>
      {state.message ? (
        <p role="alert" className="text-sm text-destructive">{state.message}</p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Sending..." : "Request info"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
