import { VStack, HStack, Stack } from "@chakra-ui/react"

import { TotalAllocations } from "../../../components/AllocationAmounts/TotalAllocations"
import { AllocationRoundsList } from "../../../components/AllocationRoundsList/AllocationRoundsList"

import { CantVoteCard } from "@/app/components/CantVoteCard/CantVoteCard"
import { StartNewRoundAlert } from "@/app/components/StartNewRoundAlert"

export const AllocationRoundsContent = () => {
  return (
    <VStack w="full" gap={8} data-testid="allocations-page">
      <CantVoteCard />
      <StartNewRoundAlert />
      <Stack
        direction={["column-reverse", "column-reverse", "row"]}
        w="full"
        justify="space-between"
        align={["stretch", "stretch", "flex-start"]}
        gap={8}>
        <HStack width="full" flex={2} justifyContent="stretch" alignItems={"stretch"} gap={4}>
          <AllocationRoundsList maxRoundsToShow={8} showLoadMore showViewAll={false} />
        </HStack>
        <VStack gap={4} flex={1} position={["static", "static", "sticky"]} top={100} right={0}>
          <TotalAllocations />
        </VStack>
      </Stack>
    </VStack>
  )
}
