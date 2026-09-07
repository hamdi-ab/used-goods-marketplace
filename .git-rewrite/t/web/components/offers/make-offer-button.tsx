"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"

import { buildLoginUrl } from "@/lib/offers/constants"
import { lazyDialog } from "@/lib/lazy-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

// T15: load the offer form only when the dialog opens (code splitting).
const OfferModal = lazyDialog(() =>
  import("@/components/offers/offer-modal").then((m) => m.OfferModal)
)

export function MakeOfferButton({
  listingId,
  listingPrice,
  isOwner,
  available,
  signedIn,
}: {
  listingId: string
  listingPrice: number
  isOwner: boolean
  available: boolean
  signedIn: boolean
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // You cannot offer on your own listing (INV-005), and draft or sold listings
  // are not open to offers — even to a signed-out visitor, who must not get a
  // CTA that would dead-end at a sold listing.
  if (isOwner || !available) return null

  // Signed-out visitors get a CTA that routes through login (with a ?next=
  // back to this listing) instead of a form that would just redirect.
  if (!signedIn) {
    return (
      <Button asChild className="h-11">
        <Link href={buildLoginUrl(pathname)}>Make an offer</Link>
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11">Make an offer</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <OfferModal
          listingId={listingId}
          listingPrice={listingPrice}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
