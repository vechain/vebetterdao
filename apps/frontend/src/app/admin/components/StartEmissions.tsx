import { useAllocationsRound, useCurrentAllocationsRoundId } from "@/api"
import { AllocationRoundsList, XAppsForecastedAmounts } from "@/components"
import { useDistributeEmission, useStartEmission } from "@/hooks"
import { VStack, HStack, Stack, Button } from "@chakra-ui/react"
import { useMemo } from "react"

export const StartEmissions = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useStartEmission({})

  const loading = isTxReceiptLoading || sendTransactionPending

  if (parseInt(currentRoundId ?? "0") > 0) return null

  return (
    <HStack spacing={12}>
      <Button
        isDisabled={parseInt(currentRoundId ?? "0") > 0}
        colorScheme="blue"
        onClick={() => sendTransaction(undefined)}
        isLoading={loading}>
        Start emissions
      </Button>
    </HStack>
  )
}
