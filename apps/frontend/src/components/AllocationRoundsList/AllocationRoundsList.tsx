import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Heading, VStack } from "@chakra-ui/react"
import { RoundState, useAllocationsRound, useAllocationsRoundsEvents, useCurrentAllocationsRoundId } from "@/api"
import { AllocationRoundCard } from "./components/AllocationRoundCard"
import { useDistributeEmission } from "@/hooks"
import { useMemo } from "react"

type Props = {
  maxRounds?: number
}
export const AllocationRoundsList: React.FC<Props> = ({ maxRounds }) => {
  const { data: allocationRoundsEvents, error: allocationRoundEventsError } = useAllocationsRoundsEvents()
  const invertedCreatedRounds = allocationRoundsEvents?.created.slice().reverse()

  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId)

  const isCurrentRoundActive = useMemo(() => {
    return currentRound?.state === "0"
  }, [currentRound, allocationRoundsEvents])

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useDistributeEmission({})

  const distributionLoading = isTxReceiptLoading || sendTransactionPending

  return (
    <VStack spacing={8} w="full" align={"flex-start"}>
      <Box w="full">
        <Heading as="h2" size="lg">
          Allocation Rounds
        </Heading>
        {!isCurrentRoundActive && (
          <Button
            variant="link"
            colorScheme="blue"
            onClick={() => sendTransaction(undefined)}
            isLoading={distributionLoading}>
            Distribute emissions and create new round
          </Button>
        )}
      </Box>
      <VStack spacing={4} w="full">
        {allocationRoundEventsError && (
          <Alert status="error">
            <AlertIcon />
            <Box>
              <AlertTitle>Error loading allocation rounds</AlertTitle>
              <AlertDescription>{allocationRoundEventsError.message}</AlertDescription>
            </Box>
          </Alert>
        )}
        {invertedCreatedRounds?.slice(0, maxRounds).map((round, i) => {
          return <AllocationRoundCard round={round} key={round.roundId} />
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
