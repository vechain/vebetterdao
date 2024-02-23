"use client"

import { Spinner } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { Suspense } from "react"

const AllocationRoundsContent = dynamic(
  () => import("./components/AllocationRoundsContent").then(mod => mod.AllocationRoundsContent),
  { ssr: false },
)

export default function AllocationsRoundPage() {
  return (
    <Suspense fallback={<Spinner alignSelf={"center"} />}>
      <AllocationRoundsContent />
    </Suspense>
  )
}
