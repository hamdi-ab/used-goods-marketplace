import type { Metadata } from "next"

import { siteName } from "@/lib/nav"
import { StaticPage, StaticSection } from "@/components/site/static-page"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteName} collects, uses, and protects your data.`,
}

export default function PrivacyPage() {
  return (
    <StaticPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="We collect the minimum amount of information needed to run the marketplace, and we protect it."
    >
      <StaticSection heading="What we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium text-foreground">Account details</span>{" "}
            — your name, email, city, and optional phone number.
          </li>
          <li>
            <span className="font-medium text-foreground">Your content</span> —{" "}
            listings, photos, ratings, reviews, and reports you submit.
          </li>
          <li>
            <span className="font-medium text-foreground">Activity</span> —{" "}
            favorites, offers, and contact attempts.
          </li>
        </ul>
      </StaticSection>

      <StaticSection heading="How we use it">
        <ul className="list-disc space-y-1 pl-5">
          <li>To show listings and connect buyers with sellers.</li>
          <li>To calculate trust scores and display verification badges.</li>
          <li>To moderate the marketplace and keep it safe.</li>
          <li>To improve the product with aggregate analytics.</li>
        </ul>
      </StaticSection>

      <StaticSection heading="What we keep private">
        <p>
          Your phone number is private by default. It is only shown to other
          users if you choose to make it public, and it is never shared with
          third parties for marketing.
        </p>
      </StaticSection>

      <StaticSection heading="Your choices">
        <p>
          You can edit your profile at any time. Contact us if you want to
          review, correct, or delete the personal data we hold about you.
        </p>
      </StaticSection>
    </StaticPage>
  )
}
