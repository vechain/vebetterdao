import { useCurrentAllocationsRoundId } from "@/api"
import { useStartEmission } from "@/hooks"
import { HStack, Button } from "@chakra-ui/react"

export const StartEmissionsButton = () => {
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
