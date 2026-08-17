import type { ReactNode } from "react"

export function StaticPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string
  title: string
  intro?: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      {eyebrow ? (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {intro ? (
        <p className="mt-3 text-base text-muted-foreground">{intro}</p>
      ) : null}
      <div className="mt-8">{children}</div>
    </main>
  )
}

export function StaticSection({
  heading,
  children,
}: {
  heading: string
  children: ReactNode
}) {
  return (
    <section className="mb-8">
      <h2 className="font-heading text-xl font-semibold text-foreground">
        {heading}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  )
}
