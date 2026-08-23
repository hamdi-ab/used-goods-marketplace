import type { Metadata } from "next"

import { fetchMarketplaceStats, fetchStatsBreakdown } from "@/lib/admin"
import {
  StatisticsVariantA,
  StatisticsVariantB,
  StatisticsVariantC,
} from "@/components/admin/statistics-variants"
import { StatisticsSwitcher } from "@/components/admin/statistics-switcher"

export const metadata: Metadata = {
  title: "Admin — Statistics",
  description: "Marketplace statistics and trends.",
}

export default async function AdminStatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const variant = typeof sp.variant === "string" ? sp.variant : "A"

  const [stats, breakdown] = await Promise.all([
    fetchMarketplaceStats(),
    fetchStatsBreakdown(),
  ])

  const props = { stats, breakdown }

  return (
    <>
      {variant === "A" && <StatisticsVariantA {...props} />}
      {variant === "B" && <StatisticsVariantB {...props} />}
      {variant === "C" && <StatisticsVariantC {...props} />}
      {process.env.NODE_ENV !== "production" ? <StatisticsSwitcher /> : null}
    </>
  )
}
