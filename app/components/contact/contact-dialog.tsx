"use client"

import { useEffect } from "react"
import { useActionState } from "react"
import { SendIcon, PhoneIcon } from "lucide-react"

import { recordContact } from "@/app/actions/contact"
import type { RecordContactState } from "@/app/actions/contact"
import { CONTACT_METHOD_LABELS } from "@/lib/contact/constants"
import type { SellerContactInfo } from "@/lib/contact"
import { Button } from "@/components/ui/button"
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

function ContactOption({
  method,
  info,
  formAction,
  pending,
  listingId,
  sellerId,
}: {
  method: "telegram" | "phone"
  info: SellerContactInfo
  formAction: (formData: FormData) => void
  pending: boolean
  listingId: string | null
  sellerId: string
}) {
  const available =
    method === "telegram"
      ? Boolean(info.telegram_username)
      : Boolean(info.phone && info.phone_public)

  return (
    <form action={formAction}>
      {listingId ? (
        <input type="hidden" name="listingId" value={listingId} readOnly />
      ) : null}
      <input type="hidden" name="sellerId" value={sellerId} readOnly />
      <input type="hidden" name="contactMethod" value={method} readOnly />
      <Button
        type="submit"
        variant={available ? "outline" : "ghost"}
        size="lg"
        className="w-full justify-start"
        disabled={pending || !available}
      >
        {method === "telegram" ? (
          <SendIcon className="mr-2.5 size-4" />
        ) : (
          <PhoneIcon className="mr-2.5 size-4" />
        )}
        {CONTACT_METHOD_LABELS[method]}
        {available ? null : " (not available)"}
      </Button>
    </form>
  )
}

export function ContactDialog({
  listingId,
  sellerId,
  contactInfo,
  onClose,
}: {
  listingId: string | null
  sellerId: string
  contactInfo: SellerContactInfo | null
  onClose: () => void
}) {
  const [state, formAction, pending] = useActionState<
    RecordContactState,
    FormData
  >(recordContact, {})

  // If the server returned a URL, open it (Telegram deep-link or tel:).
  useEffect(() => {
    if (state.url) {
      window.open(state.url, "_blank", "noopener,noreferrer")
      onClose()
    }
  }, [state.url, onClose])

  const hasAnyMethod =
    contactInfo !== null &&
    (Boolean(contactInfo.telegram_username) ||
      Boolean(contactInfo.phone && contactInfo.phone_public))

  return (
    <>
      <DialogHeader>
        <DialogTitle>Contact seller</DialogTitle>
        <DialogDescription>
          {hasAnyMethod
            ? "Choose how you'd like to contact this seller."
            : "This seller has no contact methods configured yet."}
        </DialogDescription>
      </DialogHeader>

      {state.message && !state.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      {contactInfo === null ? (
        <p className="py-4 text-sm text-muted-foreground">
          Loading contact options…
        </p>
      ) : !hasAnyMethod ? (
        <p className="py-4 text-sm text-muted-foreground">
          No contact method is available for this seller.
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          <ContactOption
            method="telegram"
            info={contactInfo}
            formAction={formAction}
            pending={pending}
            listingId={listingId}
            sellerId={sellerId}
          />
          <ContactOption
            method="phone"
            info={contactInfo}
            formAction={formAction}
            pending={pending}
            listingId={listingId}
            sellerId={sellerId}
          />
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  )
}
