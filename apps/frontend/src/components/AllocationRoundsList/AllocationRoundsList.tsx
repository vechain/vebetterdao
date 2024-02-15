import { Box, Button, Heading, VStack } from "@chakra-ui/react"
import { useAllocationsRoundsEvents, useCurrentAllocationsRoundId } from "@/api"
import { AllocationRoundCard } from "./components/AllocationRoundCard"

type Props = {
  maxRounds?: number
}
export const AllocationRoundsList: React.FC<Props> = ({ maxRounds }) => {
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()
  const invertedCreatedRounds = allocationRoundsEvents?.created.slice().reverse()

  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const isActive = currentRoundId && currentRoundId !== "0"

  return (
    <VStack spacing={8} w="full" align={"flex-start"}>
      <Box w="full">
        <Heading as="h2" size="lg">
          Allocation Rounds
        </Heading>
      </Box>
      <VStack spacing={4} w="full">
        {invertedCreatedRounds?.slice(0, maxRounds).map((round, i) => {
          return <AllocationRoundCard round={round} key={round.proposalId} />
        })}
        {invertedCreatedRounds && maxRounds && invertedCreatedRounds.length > maxRounds && (
          <Button variant="link" colorScheme="blue">
            See previous rounds
          </Button>
        )}
      </VStack>
    </VStack>
  )
}
