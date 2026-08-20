import { ArrowRight, BadgeCheck, Phone, ShieldCheck, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

// PROTOTYPE — Variant C "Story-led". The judge demo told as a 5-step arc:
// the seller journey from become-a-seller -> earn badges -> trust bump ->
// buyer sees it. This is the demo script turned into a page.

const STEPS = [
  {
    icon: Sparkles,
    title: "Start selling in one tap",
    body: "Any buyer can become a seller instantly. No forms, no gates — the core loop is frictionless.",
    shot: "Shot 2",
  },
  {
    icon: Phone,
    title: "Phone verification, best-effort",
    body: "Offer a phone OTP check from the profile. It auto-badges on success; if SMS fails, an admin reviews instead. Never blocks.",
    shot: "Shot 3",
  },
  {
    icon: BadgeCheck,
    title: "Fayda verification with one click",
    body: "Verify with the national Fayda ID — an OAuth login, not a document upload. Seconds, no SMS, no PII stored.",
    shot: "Shot 3",
  },
  {
    icon: ShieldCheck,
    title: "Trust score jumps 50 -> 70",
    body: "Verified sellers rank higher in search and carry a visible badge. The delta is the story.",
    shot: "Shot 5",
  },
  {
    icon: ArrowRight,
    title: "Buyer filters 'Verified sellers'",
    body: "Search shows only verified sellers — the badge sits in the decision path, where it changes behavior.",
    shot: "Shot 4",
  },
]

export function VariantC() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6">
      <header className="mb-10 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
          <ShieldCheck className="size-3.5" />
          Trust demo — the 5-minute arc
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold">
          Trust, earned the way the top marketplaces do it
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          List instantly. Verify when value is at stake. Reward trust in search.
        </p>
      </header>

      <ol className="mx-auto max-w-2xl space-y-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative flex gap-4 rounded-xl border bg-card p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <s.icon className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{s.title}</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {s.shot}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              {i < STEPS.length - 1 ? (
                <div className="absolute -bottom-4 left-8 hidden h-4 w-px bg-border sm:block" />
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <section aria-label="Closing" className="mx-auto mt-10 max-w-2xl rounded-xl bg-gradient-to-b from-primary/10 to-background p-6 text-center">
        <p className="font-heading text-lg font-semibold">
          Speed, trust, simplicity — a marketplace that works the way Addis does.
        </p>
        <Button size="sm" className="mt-4">
          Watch the demo
        </Button>
      </section>
    </main>
  )
}