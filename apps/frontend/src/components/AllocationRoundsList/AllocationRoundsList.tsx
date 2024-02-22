import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Card,
  CardBody,
  HStack,
  Heading,
  VStack,
} from "@chakra-ui/react"
import { useAllocationsRound, useAllocationsRoundsEvents, useCurrentAllocationsRoundId } from "@/api"
import { AllocationRoundCard } from "./components/AllocationRoundCard"
import { useDistributeEmission } from "@/hooks"
import { useCallback, useMemo, useState } from "react"
import { FiArrowUpRight } from "react-icons/fi"
import { useRouter } from "next/navigation"
import { backdropBlurAnimation } from "@/app/theme"

type Props = {
  maxRoundsToShow?: number
  showLoadMore?: boolean
  headingSize?: "xl" | "lg" | "md" | "sm" | "xs"
  showViewAll?: boolean
  renderInsideCard?: boolean
}
export const AllocationRoundsList: React.FC<Props> = ({
  maxRoundsToShow = 3,
  showLoadMore = false,
  headingSize = "xl",
  showViewAll = true,
  renderInsideCard = false,
}) => {
  const router = useRouter()

  const [totalRoundsToShow, setTotalRoundsToShow] = useState<number>(maxRoundsToShow)

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
    setTotalRoundsToShow(prev => prev + maxRoundsToShow)
  }, [totalRoundsToShow])

  const renderRounds = useMemo(() => {
    return invertedCreatedRounds?.slice(0, totalRoundsToShow)?.map((round, i) => {
      return <AllocationRoundCard round={round} key={round.roundId} />
    })
  }, [totalRoundsToShow, invertedCreatedRounds])

  const renderList = useMemo(() => {
    return (
      <VStack spacing={8} w="full" align={"flex-start"}>
        <Box w="full">
          <HStack w="full" justify="space-between" alignItems={"baseline"}>
            <Heading size={headingSize}>Allocation Rounds</Heading>
            {invertedCreatedRounds && invertedCreatedRounds.length > maxRoundsToShow && showViewAll && (
              <Button
                variant="link"
                colorScheme="blue"
                rightIcon={<FiArrowUpRight />}
                onClick={() => router.push("/rounds")}>
                See all rounds
              </Button>
            )}
          </HStack>
          {!isCurrentRoundActive && (
            <Button
              variant="link"
              colorScheme="blue"
              onClick={() => sendTransaction(undefined)}
              isLoading={distributionLoading}>
              Start new round
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
          {renderRounds}
          {invertedCreatedRounds && invertedCreatedRounds.length > totalRoundsToShow && showLoadMore && (
            <Button variant="link" colorScheme="blue" onClick={loadMore}>
              Load more
            </Button>
          )}
        </VStack>
      </VStack>
    )
  }, [allocationRoundEventsError, distributionLoading, isCurrentRoundActive, totalRoundsToShow, invertedCreatedRounds])

  return (
    <>
      {renderInsideCard ? (
        <Card>
          <CardBody>{renderList}</CardBody>
        </Card>
      ) : (
        renderList
      )}
    </>
  )
}
