import { useAllocationsRound, useCurrentAllocationsRoundId } from "@/api"
import { AllocationRoundsList, XAppsForecastedAmounts } from "@/components"
import { useDistributeEmission } from "@/hooks"
import { VStack, HStack, Stack, Button, Text } from "@chakra-ui/react"
import { useMemo } from "react"

export const StartRound = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId)
  const isCurrentRoundActive = useMemo(() => {
    return currentRound?.state === "0"
  }, [currentRound])

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useDistributeEmission({})

  const distributionLoading = isTxReceiptLoading || sendTransactionPending

  return (
    <HStack w="full" spacing={12}>
      <Button
        colorScheme="blue"
        isDisabled={isCurrentRoundActive}
        onClick={() => sendTransaction(undefined)}
        isLoading={distributionLoading}>
        Start new round
      </Button>
      <Text>
        {currentRound.voteEndTimestamp?.isBefore()
          ? `Current round ended ${currentRound.voteEndTimestamp?.fromNow()}`
          : `Current round will end in ${currentRound.voteEndTimestamp?.fromNow()}`}
      </Text>
    </HStack>
  )
}
