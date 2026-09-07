import type { Metadata } from "next"

import { siteName } from "@/lib/nav"
import { StaticPage, StaticSection } from "@/components/site/static-page"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms that govern your use of ${siteName}.`,
}

export default function TermsPage() {
  return (
    <StaticPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms govern your use of VinTech Marketplace. By using the service you agree to them."
    >
      <StaticSection heading="1. The service">
        <p>
          {siteName} provides an online marketplace that connects buyers and
          sellers of second-hand goods. We facilitate discovery and
          communication; we are not a party to the transaction between a buyer
          and a seller.
        </p>
      </StaticSection>

      <StaticSection heading="2. Your account">
        <p>
          You are responsible for the accuracy of your profile and for keeping
          your login details secure. Accounts must be used personally and may
          not be transferred.
        </p>
      </StaticSection>

      <StaticSection heading="3. Acceptable use">
        <ul className="list-disc space-y-1 pl-5">
          <li>Only list goods you are genuinely able to sell.</li>
          <li>Describe items truthfully, including condition and defects.</li>
          <li>Do not post prohibited, illegal, or infringing content.</li>
          <li>
            Do not use the platform to scam, harass, or mislead other users.
          </li>
        </ul>
      </StaticSection>

      <StaticSection heading="4. Transactions">
        <p>
          Buyers and sellers agree on price, payment, and delivery directly. We
          do not handle payments and do not guarantee any item you buy.
        </p>
      </StaticSection>

      <StaticSection heading="5. Moderation">
        <p>
          We may suspend accounts, remove listings, or reject reports that
          breach these terms. A seller who is suspended loses selling access.
        </p>
      </StaticSection>

      <StaticSection heading="6. Changes">
        <p>
          We may update these terms from time to time. Continued use of the
          service after changes are published means you accept the updated
          terms.
        </p>
      </StaticSection>
    </StaticPage>
  )
}
