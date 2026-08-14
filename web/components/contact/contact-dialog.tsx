"use client"

import { useEffect } from "react"
import { useActionState } from "react"
import { SendIcon } from "lucide-react"

import { recordContact } from "@/app/actions/contact"
import type { RecordContactState } from "@/app/actions/contact"
import {
  availableContactMethods,
  CONTACT_METHOD_LABELS,
} from "@/lib/contact/constants"
import type { SellerContactInfo, ContactMethod } from "@/lib/contact/constants"
import { Button } from "@/components/ui/button"
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface ContactOptionProps {
  method: ContactMethod
  formAction: (formData: FormData) => void
  pending: boolean
  listingId: string | null
  sellerId: string
}

interface ContactDialogProps {
  listingId: string | null
  sellerId: string
  contactInfo: SellerContactInfo | null
  onClose: () => void
}

function ContactOption({
  method,
  formAction,
  pending,
  listingId,
  sellerId,
}: ContactOptionProps) {
  return (
    <form action={formAction}>
      {listingId ? (
        <input type="hidden" name="listingId" value={listingId} readOnly />
      ) : null}
      <input type="hidden" name="sellerId" value={sellerId} readOnly />
      <input type="hidden" name="contactMethod" value={method} readOnly />
      <Button
        type="submit"
        variant="outline"
        size="lg"
        className="w-full justify-start"
        disabled={pending}
      >
        {method === "telegram" ? (
          <SendIcon className="mr-2.5 size-4" />
        ) : (
          <SendIcon className="mr-2.5 size-4" />
        )}
        {CONTACT_METHOD_LABELS[method]}
      </Button>
    </form>
  )
}

export function ContactDialog({
  listingId,
  sellerId,
  contactInfo,
  onClose,
}: ContactDialogProps) {
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

  const methods = contactInfo
    ? availableContactMethods(contactInfo)
    : []
  const hasAnyMethod = methods.length > 0

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
          {methods.map((method) => (
            <ContactOption
              key={method}
              method={method}
              formAction={formAction}
              pending={pending}
              listingId={listingId}
              sellerId={sellerId}
            />
          ))}
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
