import { useAllocationsRound, useCurrentAllocationsRoundId } from "@/api"
import { AllocationRoundsList, XAppsForecastedAmounts } from "@/components"
import { useDistributeEmission } from "@/hooks"
import { VStack, HStack, Stack, Button } from "@chakra-ui/react"
import { useMemo } from "react"

export const AdminContent = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId)
  const isCurrentRoundActive = useMemo(() => {
    return currentRound?.state === "0"
  }, [currentRound])

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useDistributeEmission({})

  const distributionLoading = isTxReceiptLoading || sendTransactionPending

  return (
    <VStack w="full" spacing={12}>
      {!isCurrentRoundActive && (
        <Button
          variant="link"
          colorScheme="blue"
          onClick={() => sendTransaction(undefined)}
          isLoading={distributionLoading}>
          Start new round
        </Button>
      )}
    </VStack>
  )
}
