import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Heading, VStack } from "@chakra-ui/react"
import { useAllocationsRound, useAllocationsRoundsEvents, useCurrentAllocationsRoundId } from "@/api"
import { AllocationRoundCard } from "./components/AllocationRoundCard"
import { useDistributeEmission } from "@/hooks"
import { useCallback, useMemo, useState } from "react"

type Props = {
  roundsPerPage?: number
  showLoadMore?: boolean
  cardVariant?: "compact" | "full"
}
export const AllocationRoundsList: React.FC<Props> = ({
  roundsPerPage = 3,
  showLoadMore = false,
  cardVariant = "compact",
}) => {
  const [totalRoundsToShow, setTotalRoundsToShow] = useState<number>(roundsPerPage)

  const { data: allocationRoundsEvents, error: allocationRoundEventsError } = useAllocationsRoundsEvents()
  const invertedCreatedRounds = allocationRoundsEvents?.created.slice().reverse()

  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId)

  const isCurrentRoundActive = useMemo(() => {
    return currentRound?.state === "0"
  }, [currentRound, allocationRoundsEvents])

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useDistributeEmission({})

  const distributionLoading = isTxReceiptLoading || sendTransactionPending

  const loadMore = useCallback(() => {
    setTotalRoundsToShow(prev => prev + roundsPerPage)
  }, [totalRoundsToShow])

  const renderRounds = useCallback(() => {
    return invertedCreatedRounds?.slice(0, totalRoundsToShow)?.map((round, i) => {
      return <AllocationRoundCard round={round} key={round.roundId} variant={cardVariant} />
    })
  }, [totalRoundsToShow])

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
        {renderRounds()}
        {invertedCreatedRounds && invertedCreatedRounds.length > totalRoundsToShow && showLoadMore && (
          <Button variant="link" colorScheme="blue" onClick={loadMore}>
            Load more
          </Button>
        )}
      </VStack>
    </VStack>
  )
}
