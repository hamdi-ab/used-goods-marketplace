"use client"

import { cn } from "@/lib/utils"
import {
  REPORT_STATUS_COLORS,
  REPORT_STATUS_LABELS,
  type ReportStatus,
} from "@/lib/reports/constants"
import { Badge } from "@/components/ui/badge"

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <Badge className={cn(REPORT_STATUS_COLORS[status])}>
      {REPORT_STATUS_LABELS[status]}
    </Badge>
  )
}
