"use client"

import { Box, Spinner, Stack, VStack } from "@chakra-ui/react"
import { AllocationRoundNavbar } from "../components/AllocationRoundNavbar"
import { AllocationRoundHeaderCard } from "../components/AllocationRoundHeaderCard/AllocationRoundHeaderCard"
import { AllocationXAppsVotesCard } from "@/components"
import { AllocationRoundSessionInfoCard } from "../components/AllocationRoundSessionInfoCard"
import { AllocationRoundUserVotes } from "../components/AllocationRoundUserVotes/AllocationRoundUserVotes"
import { useAllocationsRoundState } from "@/api"
import { useLayoutEffect } from "react"
import { redirect } from "next/navigation"

type Props = {
  params: {
    roundId: string
  }
}
export const AllocationRoundContent = ({ params }: Readonly<Props>) => {
  const currentAllocationState = useAllocationsRoundState(params.roundId)

  useLayoutEffect(() => {
    if (currentAllocationState.error) redirect("/")
  }, [currentAllocationState.error])

  if (currentAllocationState.isLoading)
    return (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    )
  if (currentAllocationState.error) return null
  return (
    <VStack w="full" spacing={8} data-testid={`allocation-${params.roundId}-page`}>
      <AllocationRoundNavbar roundId={params.roundId} />
      <AllocationRoundHeaderCard roundId={params.roundId} />
      <Stack
        direction={["column-reverse", "column-reverse", "row"]}
        w="full"
        justify="space-between"
        align={["flex-start", "flex-start", "stretch"]}
        spacing={12}>
        <Box flex={[1, 0.6, 0.6, 0.7]} w="full">
          <AllocationXAppsVotesCard roundId={params.roundId} />
        </Box>
        <VStack flex={[1, 0.4, 0.4, 0.3]} spacing={8} w="full">
          <AllocationRoundSessionInfoCard roundId={params.roundId} />
        </VStack>
      </Stack>
      <AllocationRoundUserVotes roundId={params.roundId} />
    </VStack>
  )
}
