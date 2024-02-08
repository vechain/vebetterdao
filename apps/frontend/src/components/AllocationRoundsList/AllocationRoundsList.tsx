import { Box, HStack, Heading, VStack } from "@chakra-ui/react"
import { CreateNewAllocationRoundButton } from "./components/CreateNewAllocationRoundButton"
import { useAllocationsRoundsEvents } from "@/api"
import { AllocationRoundCard } from "./components/AllocationRoundCard"

export const AllocationRoundsList = () => {
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()
  return (
    <VStack spacing={4} w="full" align={"flex-start"}>
      <Box>
        <Heading as="h2" size="lg">
          Allocation Rounds
        </Heading>
        <CreateNewAllocationRoundButton />
      </Box>
      <VStack spacing={4} w="full">
        {allocationRoundsEvents?.created.map((round, i) => {
          return <AllocationRoundCard round={round} key={round.proposalId} />
        })}
      </VStack>
    </VStack>
  )
}
