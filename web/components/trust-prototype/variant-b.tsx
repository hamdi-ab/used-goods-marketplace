import { TrendingUp } from "lucide-react"

import { MOCK } from "./variants"

// PROTOTYPE — Variant B "Score-led". The composite trust score is the hero:
// a big number with a before/after delta (50 -> 70), a per-signal breakdown,
// and a slim score chip on listing cards instead of a badge wall.

function ScoreRing({ score, delta }: { score: number; delta: number }) {
  const pct = (score / 100) * 360
  return (
    <div className="relative flex size-28 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(var(--color-primary) ${pct}deg, var(--color-border) 0deg)` }}
    >
      <div className="flex size-24 flex-col items-center justify-center rounded-full bg-background">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-xs text-muted-foreground">trust</span>
      </div>
      <span className="absolute -bottom-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
        <TrendingUp className="size-3" /> +{delta}
      </span>
    </div>
  )
}

function SignalRow({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex items-center justify-between border-b py-2 text-sm last:border-0">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

export function VariantB() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
          <TrendingUp className="size-3.5" />
          Trust demo — the score tells the story
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold">
          One number you can trust
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          The composite trust score turns reviews, completions, and
          verification into a single comparable signal.
        </p>
      </header>

      <section aria-label="Score hero" className="mx-auto mb-10 grid max-w-3xl gap-6 rounded-xl border bg-card p-6 sm:grid-cols-[auto_1fr]">
        <ScoreRing score={MOCK.verified.trust_score} delta={20} />
        <div>
          <p className="text-lg font-semibold">{MOCK.verified.name}</p>
          <p className="mb-2 text-sm text-muted-foreground">
            Verified by Fayda ID + phone. Score grew from 50 when she verified.
          </p>
          <SignalRow label="Profile completion" value="100%" hint="All profile fields filled" />
          <SignalRow label="Verification" value="+20" hint="Fayda ID + phone confirmed" />
          <SignalRow label="Ratings" value="4.8★ (23)" hint="Completed transactions" />
          <SignalRow label="Reports" value="0" hint="No conduct flags" />
        </div>
      </section>

      <section aria-label="Compare" className="mx-auto mb-10 grid max-w-3xl gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{MOCK.unverified.name}</p>
            <span className="text-sm font-semibold text-muted-foreground">50</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 rounded-full bg-muted-foreground/40" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            New seller — verify with Fayda to raise your score and rank higher.
          </p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{MOCK.verified.name}</p>
            <span className="text-sm font-semibold text-primary">70</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[70%] rounded-full bg-primary" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Verified sellers rank higher in search — buyers see her first.
          </p>
        </div>
      </section>

      <section aria-label="Listing chips" className="mx-auto max-w-3xl">
        <h2 className="mb-3 font-heading text-lg font-semibold">On listing cards</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {MOCK.listings.map((l) => (
            <div key={l.id} className="rounded-lg border bg-card p-3">
              <div className="mb-2 flex aspect-[4/3] items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                Photo
              </div>
              <p className="line-clamp-1 text-sm font-medium">{l.title}</p>
              <p className="text-sm font-semibold">ETB {l.price.toLocaleString()}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{l.city}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  <TrendingUp className="size-3" /> Trust 70
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}