"use client"

import { Box, Stack, VStack } from "@chakra-ui/react"
import { AllocationRoundNavbar } from "../components/AllocationRoundNavbar"
import { AllocationRoundDetails } from "../components/AllocationRoundDetails"
import { AllocationXAppsVotesCard } from "@/components"
import { AllocationRoundSessionInfoCard } from "../components/AllocationRoundSessionInfoCard"
import { AllocationRoundUserVotes } from "../components/AllocationRoundUserVotes/AllocationRoundUserVotes"

type Props = {
  params: {
    roundId: string
  }
}
export const AllocationRoundContent = ({ params }: Readonly<Props>) => {
  return (
    <VStack w="full" spacing={8}>
      <AllocationRoundNavbar roundId={params.roundId} />
      <AllocationRoundDetails roundId={params.roundId} />
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
