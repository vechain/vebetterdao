import { useAllocationsRound, useCurrentAllocationsRoundId } from "@/api"
import { useDistributeEmission } from "@/hooks"
import { VStack, Button, Text } from "@chakra-ui/react"
import { useMemo } from "react"

export const StartRound = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId)
  const isCurrentRoundActive = useMemo(() => {
    return currentRound?.state === "0"
  }, [currentRound])

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useDistributeEmission({})
  const distributionLoading = isTxReceiptLoading || sendTransactionPending

  if (parseInt(currentRoundId ?? "0") < 1) return null

  return (
    <VStack w="full" spacing={4}>
      <VStack w="full" spacing={4} alignItems="start">
        <VStack>
          <Text>
            {currentRound.voteEndTimestamp?.isBefore()
              ? `Last round (#${currentRoundId}) ended ${currentRound.voteEndTimestamp?.fromNow()}`
              : `Current round (#${currentRoundId}) will end in ${currentRound.voteEndTimestamp?.fromNow()}`}
          </Text>
        </VStack>
        <VStack>
          <Button
            colorScheme="blue"
            isDisabled={isCurrentRoundActive}
            onClick={() => sendTransaction(undefined)}
            isLoading={distributionLoading}>
            Start new round
          </Button>
        </VStack>
      </VStack>
    </VStack>
  )
}
