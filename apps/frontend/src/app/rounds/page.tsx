"use client"

import dynamic from "next/dynamic"

const AllocationRoundsContent = dynamic(
  () => import("./components/AllocationRoundsContent").then(mod => mod.AllocationRoundsContent),
  { ssr: false },
)
export default function ProposalsPage() {
  return <AllocationRoundsContent />
}
