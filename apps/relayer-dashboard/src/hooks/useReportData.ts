"use client"

import { useQuery } from "@tanstack/react-query"

import type { AnalyticsReport } from "@/lib/types"

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
const REPORT_URL = `${basePath}/data/report.json`

async function fetchReport(): Promise<AnalyticsReport> {
  const res = await fetch(REPORT_URL, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load report")
  return res.json() as Promise<AnalyticsReport>
}

export function useReportData() {
  return useQuery({
    queryKey: ["relayer-report"],
    queryFn: fetchReport,
    staleTime: 5 * 60 * 1000,
  })
}
