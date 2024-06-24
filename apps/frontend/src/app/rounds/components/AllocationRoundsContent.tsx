import { AllocationRoundsList, TotalAllocations } from "@/components"
import { VStack, HStack, Stack } from "@chakra-ui/react"

export const AllocationRoundsContent = () => {
  return (
    <VStack w="full" spacing={12} data-testid="allocations-page">
      <Stack
        direction={["column-reverse", "column-reverse", "row"]}
        w="full"
        justify="space-between"
        align={["stretch", "stretch", "flex-start"]}
        spacing={8}>
        <HStack width="full" flex={2} justifyContent="stretch" alignItems={"stretch"} spacing={4}>
          <AllocationRoundsList maxRoundsToShow={8} showLoadMore showViewAll={false} />
        </HStack>
        <VStack spacing={4} flex={1} position={["static", "static", "sticky"]} top={100} right={0}>
          <TotalAllocations />
        </VStack>
      </Stack>
    </VStack>
  )
}
