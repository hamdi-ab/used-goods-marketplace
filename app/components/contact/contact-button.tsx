"use client"

import Link from "next/link"
import { useState } from "react"
import { MessageCircleIcon } from "lucide-react"

import { buildLoginUrl } from "@/lib/contact/constants"
import type { SellerContactInfo } from "@/lib/contact"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ContactDialog } from "@/components/contact/contact-dialog"

export function ContactButton({
  listingId,
  sellerId,
  signedIn,
  contactInfo,
}: {
  listingId?: string | null
  sellerId: string
  signedIn: boolean
  contactInfo: SellerContactInfo | null
}) {
  const [open, setOpen] = useState(false)
  // Incrementing the key on each open forces ContactDialog to remount,
  // resetting its useActionState. Without this, a previously-opened contact
  // method's URL would fire again on reopen via the useEffect.
  const [openKey, setOpenKey] = useState(0)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) setOpenKey((k) => k + 1)
  }

  const href = listingId ? `/listings/${listingId}` : `/users/${sellerId}`

  // Signed-out visitors route through login (with a ?next= back to the page).
  if (!signedIn) {
    return (
      <Button asChild size="lg">
        <Link href={buildLoginUrl(href)}>
          <MessageCircleIcon className="mr-1.5 size-4" />
          Contact seller
        </Link>
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg">
          <MessageCircleIcon className="mr-1.5 size-4" />
          Contact seller
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <ContactDialog
          key={openKey}
          listingId={listingId ?? null}
          sellerId={sellerId}
          contactInfo={contactInfo}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
