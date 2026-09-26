interface HandoffBannerProps {
  status: string
  paymentStatus?: string | null
  isBuyer: boolean
}

export function HandoffBanner({ status, paymentStatus, isBuyer }: HandoffBannerProps) {
  if (status === "pending") return null

  if (status === "accepted") {
    if (paymentStatus === "paid") {
      return (
        <div className="mt-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-semibold">Paid</span>
            <span className="text-muted-foreground">—</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isBuyer
              ? "Payment confirmed. The seller will prepare your item."
              : "Payment received. Prepare the item for handoff."}
          </p>
        </div>
      )
    }
    return (
      <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-amber-600 font-semibold">Awaiting payment</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isBuyer
            ? "Complete payment to secure this item."
            : "The buyer is completing payment."}
        </p>
      </div>
    )
  }

  if (status === "sold") {
    return (
      <div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 font-semibold">Sold</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isBuyer
            ? "Complete the handoff with the seller."
            : "Hand off the item to the buyer."}
        </p>
      </div>
    )
  }

  if (status === "declined") {
    return (
      <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-semibold">Declined</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          This offer was declined. The listing remains available.
        </p>
      </div>
    )
  }

  if (status === "cancelled") {
    return (
      <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 p-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 font-semibold">Cancelled</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          This offer was cancelled.
        </p>
      </div>
    )
  }

  if (status === "expired") {
    return (
      <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 p-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 font-semibold">Expired</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          This offer expired. You can make a new one.
        </p>
      </div>
    )
  }

  if (status === "disputed") {
    return (
      <div className="mt-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 p-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-purple-600 font-semibold">Disputed</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          An admin is reviewing this dispute.
        </p>
      </div>
    )
  }

  return null
}