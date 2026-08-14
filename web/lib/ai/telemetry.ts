import "server-only"

// T14 analytics (FS-005: track ai_used, ai_regenerated, ai_accepted). In-process
// counters are the integration point for the observability metrics (engineering
// §8) — like the AC-4 rate limiter, this is per-instance on the Vercel target;
// a shared metrics sink (PostHog/Vercel Analytics) is the future hardening.
// Server-only so the counters can never be read or written from the client.

export type AiUsageEvent = "ai_used" | "ai_regenerated" | "ai_accepted"

const counters: Record<AiUsageEvent, number> = {
  ai_used: 0,
  ai_regenerated: 0,
  ai_accepted: 0,
}

export function recordAiUsage(event: AiUsageEvent): void {
  counters[event] += 1
}

export function getAiUsageCounters(): Readonly<Record<AiUsageEvent, number>> {
  return { ...counters }
}

export function resetAiUsageCounters(): void {
  counters.ai_used = 0
  counters.ai_regenerated = 0
  counters.ai_accepted = 0
}
