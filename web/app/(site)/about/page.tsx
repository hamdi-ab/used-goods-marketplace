import type { Metadata } from "next"
import Link from "next/link"

import { siteName } from "@/lib/nav"
import { StaticPage, StaticSection } from "@/components/site/static-page"

export const metadata: Metadata = {
  title: "About",
  description: `About ${siteName}, Ethiopia's trusted marketplace for second-hand goods.`,
}

export default function AboutPage() {
  return (
    <StaticPage
      eyebrow="About"
      title={`About ${siteName}`}
      intro="Our ambition is to become Ethiopia's most trusted marketplace for buying and selling second-hand goods."
    >
      <StaticSection heading="Our mission">
        <p>
          We empower Ethiopian communities to confidently exchange second-hand
          goods through intelligent technology, transparent trust systems, and
          an exceptional user experience.
        </p>
      </StaticSection>

      <StaticSection heading="Why we exist">
        <p>
          Today most peer-to-peer second-hand trade in Ethiopia happens through
          Telegram channels, Facebook groups, and informal posts. Those
          communities are large, but they were never built to work as
          marketplaces: search is poor, listings are duplicated, photos are
          low-quality, and trust between strangers is hard to establish.
        </p>
        <p>
          We replace fragmented conversations with structured commerce — so
          buyers discover relevant products in seconds, sellers publish
          professional listings in minutes, and everyone can tell who they are
          dealing with before they make contact.
        </p>
      </StaticSection>

      <StaticSection heading="What we offer">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium text-foreground">Smart search</span> —
            find products quickly with categories and filters.
          </li>
          <li>
            <span className="font-medium text-foreground">Seller trust</span> —
            trust scores, verification badges, ratings, and reviews.
          </li>
          <li>
            <span className="font-medium text-foreground">AI-assisted listings</span>{" "}
            — publish professional listings in under a minute.
          </li>
          <li>
            <span className="font-medium text-foreground">Familiar contact</span>{" "}
            — keep talking on the channels you already use, like Telegram and
            phone.
          </li>
          <li>
            <span className="font-medium text-foreground">Community safety</span>{" "}
            — reporting and moderation keep the marketplace fair.
          </li>
        </ul>
      </StaticSection>

      <StaticSection heading="Our goal">
        <p>
          Our goal is not to replace the communication channels Ethiopians
          already trust — it is to organise the marketplace around them. See how{" "}
          <Link href="/safety" className="font-medium text-primary hover:underline">
            we keep the community safe
          </Link>{" "}
          or{" "}
          <Link href="/help" className="font-medium text-primary hover:underline">
            get help
          </Link>
          .
        </p>
      </StaticSection>
    </StaticPage>
  )
}
