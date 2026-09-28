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
        <div
          role="status"
          aria-live="polite"
          className="mt-3 w-full rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-800 dark:bg-green-950/20"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-green-600">Paid</span>
            <span className="text-muted-foreground">—</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground break-words">
            {isBuyer
              ? "Payment confirmed. The seller will prepare your item."
              : "Payment received. Prepare the item for handoff."}
          </p>
        </div>
      )
    }
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-3 w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/20"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-amber-600">Awaiting payment</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground break-words">
          {isBuyer
            ? "Complete payment to secure this item."
            : "The buyer is completing payment."}
        </p>
      </div>
    )
  }

  if (status === "sold") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-3 w-full rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-950/20"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-blue-600">Sold</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground break-words">
          {isBuyer
            ? "Complete the handoff with the seller."
            : "Hand off the item to the buyer."}
        </p>
      </div>
    )
  }

  if (status === "declined") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-3 w-full rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-950/20"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-red-600">Declined</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground break-words">
          This offer was declined. The listing remains available.
        </p>
      </div>
    )
  }

  if (status === "cancelled") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-950/20"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-gray-600">Cancelled</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground break-words">
          This offer was cancelled.
        </p>
      </div>
    )
  }

  if (status === "expired") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-950/20"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-gray-600">Expired</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground break-words">
          This offer expired. You can make a new one.
        </p>
      </div>
    )
  }

  if (status === "disputed") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-3 w-full rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm dark:border-purple-800 dark:bg-purple-950/20"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-purple-600">Disputed</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground break-words">
          An admin is reviewing this dispute.
        </p>
      </div>
    )
  }

  return null
}