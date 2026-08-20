"use client";

import { useState } from "react";
import { CheckIcon, Share2Icon } from "lucide-react";

// PROTOTYPE — "Share" copies the listing URL to the clipboard (dev-only
// variant surface). A real implementation would also hit the Web Share API.
export function PrototypeShareButton({
  href,
}: {
  href: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(href);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          /* ignore — fall back to manual */
        }
      }}
      className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      {copied ? (
        <>
          <CheckIcon className="size-4 text-[#2563EB]" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Share2Icon className="size-4" />
          <span>Share</span>
        </>
      )}
    </button>
  );
}
