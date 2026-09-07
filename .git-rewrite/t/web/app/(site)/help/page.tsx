import type { Metadata } from "next"
import Link from "next/link"

import { siteName } from "@/lib/nav"
import { StaticPage, StaticSection } from "@/components/site/static-page"

export const metadata: Metadata = {
  title: "Help Center",
  description: `Answers to common questions about buying and selling on ${siteName}.`,
}

export default function HelpPage() {
  return (
    <StaticPage
      eyebrow="Help Center"
      title="How can we help?"
      intro="Common questions about buying, selling, and staying safe on VinTech Marketplace."
    >
      <StaticSection heading="For buyers">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium text-foreground">Finding items</span>{" "}
            — use Search to browse by keyword, or pick a category to explore.
            Filters narrow results by price, condition, and location.
          </li>
          <li>
            <span className="font-medium text-foreground">Judging a seller</span>{" "}
            — check the seller&apos;s trust score, verification badges, ratings,
            and reviews before you make contact.
          </li>
          <li>
            <span className="font-medium text-foreground">Contacting a seller</span>{" "}
            — open a listing and choose the seller&apos;s preferred contact
            method (Telegram or phone).
          </li>
          <li>
            <span className="font-medium text-foreground">Saving listings</span>{" "}
            — tap the heart on any listing to add it to your favorites.
          </li>
        </ul>
      </StaticSection>

      <StaticSection heading="For sellers">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium text-foreground">Listing an item</span>{" "}
            — open Sell, add your photos and details, and publish. Use the AI
            assistant to write a professional description in seconds.
          </li>
          <li>
            <span className="font-medium text-foreground">Managing offers</span>{" "}
            — track and reply to offers from your Offers page. You choose which
            offer to accept.
          </li>
          <li>
            <span className="font-medium text-foreground">Editing or hiding</span>{" "}
            — edit any of your listings, or hide a sold item so it stops
            appearing in search.
          </li>
          <li>
            <span className="font-medium text-foreground">Building trust</span>{" "}
            — complete your profile and get verified to earn a higher trust
            score and more buyer confidence.
          </li>
        </ul>
      </StaticSection>

      <StaticSection heading="Problems with an order or user">
        <p>
          If a listing breaks the rules, is misleading, or a user behaves
          badly, report it from the listing or profile page. Our moderation
          team reviews every report.{" "}
          <Link href="/safety" className="font-medium text-primary hover:underline">
            Read our safety tips
          </Link>{" "}
          to learn what to watch for.
        </p>
      </StaticSection>

      <StaticSection heading="Still need help?">
        <p>
          Get in touch via the{" "}
          <Link href="/contact" className="font-medium text-primary hover:underline">
            contact page
          </Link>{" "}
          and our team will get back to you.
        </p>
      </StaticSection>
    </StaticPage>
  )
}
