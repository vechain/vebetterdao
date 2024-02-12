"use client"

import { HStack, VStack } from "@chakra-ui/react"
import { AllocationRoundDetails } from "../components/AllocationRoundDetails"
import { AllocationRoundNavbar } from "../components/AllocationRoundNavbar"
import { HorizontalChartBar } from "@/components"
import { useXApps, useXAppsVotes } from "@/api"

export default function Round({ params }: { params: { roundId: string } }) {
  const { data: xApps } = useXApps()
  const xAppsVotes = useXAppsVotes(xApps?.map(app => app.id) ?? [], params.roundId)

  const data = xAppsVotes.map(app => ({
    votes: app.data?.votes,
    app: app.data?.app,
  }))
  return (
    <VStack w="full" spacing={6}>
      <AllocationRoundNavbar roundId={params.roundId} />
      <AllocationRoundDetails roundId={params.roundId} />
      <HStack w="full" justify="space-between">
        <HorizontalChartBar data={data} xKey="votes" yKey="app" />
      </HStack>
    </VStack>
  )
}
