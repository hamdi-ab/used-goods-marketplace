import type { Metadata } from "next"
import { MailIcon, MessageCircleIcon, ShieldIcon } from "lucide-react"

import { siteName } from "@/lib/nav"
import { StaticPage } from "@/components/site/static-page"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with the ${siteName} team.`,
}

const contactChannels = [
  {
    icon: MailIcon,
    title: "Email us",
    body: "For account, listing, or trust-score questions.",
    action: "hello@dagimgebeya.com",
    href: "mailto:hello@dagimgebeya.com",
  },
  {
    icon: MessageCircleIcon,
    title: "Telegram",
    body: "The fastest way to reach the team during business hours.",
    action: "@dagimgebeya",
    href: "https://t.me/dagimgebeya",
  },
  {
    icon: ShieldIcon,
    title: "Report a problem",
    body: "Listing looks wrong or a user behaved badly? Report it from the listing or profile page and our moderators will review it.",
    action: "Learn about reporting",
    href: "/safety",
  },
]

export default function ContactPage() {
  return (
    <StaticPage
      eyebrow="Contact"
      title="Talk to us"
      intro={`Questions, feedback, or a problem on ${siteName}? Pick the channel that suits you.`}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {contactChannels.map((channel) => (
          <Card key={channel.title}>
            <CardContent className="flex h-full flex-col gap-2 py-6">
              <channel.icon className="size-6 text-primary" />
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {channel.title}
              </h2>
              <p className="flex-1 text-sm text-muted-foreground">
                {channel.body}
              </p>
              <a
                href={channel.href}
                className="text-sm font-medium text-primary hover:underline"
              >
                {channel.action}
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </StaticPage>
  )
}
