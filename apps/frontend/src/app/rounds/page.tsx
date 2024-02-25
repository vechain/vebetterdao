"use client"

import { AnalyticsUtils } from "@/utils"
import { Spinner } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { Suspense, useEffect } from "react"

const AllocationRoundsContent = dynamic(
  () => import("./components/AllocationRoundsContent").then(mod => mod.AllocationRoundsContent),
  { ssr: false },
)

export default function AllocationsRoundPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("Rounds")
  }, [])
  return (
    <Suspense fallback={<Spinner alignSelf={"center"} />}>
      <AllocationRoundsContent />
    </Suspense>
  )
}
