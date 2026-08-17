import type { Metadata } from "next"

import { siteName } from "@/lib/nav"
import { StaticPage, StaticSection } from "@/components/site/static-page"

export const metadata: Metadata = {
  title: "Safety Tips",
  description: `How to buy and sell safely on ${siteName}.`,
}

export default function SafetyPage() {
  return (
    <StaticPage
      eyebrow="Safety"
      title="Safety tips"
      intro="Buying from a stranger should feel safe. Follow these tips to keep every transaction simple and trustworthy."
    >
      <StaticSection heading="Before you buy">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium text-foreground">Check the seller</span>{" "}
            — review their trust score, verification badges, ratings, and how
            long they&apos;ve been a member.
          </li>
          <li>
            <span className="font-medium text-foreground">Read the listing</span>{" "}
            — look at the condition, photos, and description. Ask for extra
            photos if anything is unclear.
          </li>
          <li>
            <span className="font-medium text-foreground">Compare prices</span>{" "}
            — search for similar items so you know a fair price before you
            negotiate.
          </li>
          <li>
            <span className="font-medium text-foreground">Meet in person</span>{" "}
            — whenever possible, inspect the item face-to-face before you pay.
            Meet in a public place.
          </li>
        </ul>
      </StaticSection>

      <StaticSection heading="Before you sell">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium text-foreground">Describe honestly</span>{" "}
            — accurate condition and clear photos reduce disputes and build
            your trust score.
          </li>
          <li>
            <span className="font-medium text-foreground">Set a fair price</span>{" "}
            — research what similar items sell for.
          </li>
          <li>
            <span className="font-medium text-foreground">Confirm the buyer</span>{" "}
            — agree on the meeting point, the price, and payment method before
            you travel.
          </li>
          <li>
            <span className="font-medium text-foreground">Keep records</span> —{" "}
            note who you dealt with and when, in case you need to follow up.
          </li>
        </ul>
      </StaticSection>

      <StaticSection heading="Signals to watch for">
        <ul className="list-disc space-y-1 pl-5">
          <li>Prices that look too good to be true.</li>
          <li>Buyers or sellers pushing you to leave the marketplace for payment.</li>
          <li>Anyone asking for an upfront deposit before you have seen the item.</li>
          <li>Sellers who refuse to meet in person or share extra photos.</li>
          <li>Pressured, urgent requests that rush you into a decision.</li>
        </ul>
        <p>
          If you see any of these, trust your instincts. You can report a
          listing or seller at any time and our moderation team will review it.
        </p>
      </StaticSection>

      <StaticSection heading="We have your back">
        <p>
          Every seller on {siteName} carries a trust score built from completed
          sales, ratings, and verifications — so you can always see who you are
          dealing with before you make contact.
        </p>
      </StaticSection>
    </StaticPage>
  )
}
