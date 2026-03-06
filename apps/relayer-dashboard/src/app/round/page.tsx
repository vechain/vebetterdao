"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

import { RoundDetailSkeleton } from "@/components/RoundDetailSkeleton"

const RoundDetailPage = dynamic(() => import("@/app/round/RoundDetailPage"), {
  ssr: false,
})

export default function RoundPage() {
  return (
    <Suspense fallback={<RoundDetailSkeleton />}>
      <RoundDetailPage />
    </Suspense>
  )
}
