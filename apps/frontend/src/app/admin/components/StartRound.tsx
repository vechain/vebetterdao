import { useAllocationsRound, useCurrentAllocationsRoundId } from "@/api"
import { TransactionModal } from "@/components/TransactionModal"
import { useDistributeEmission } from "@/hooks"
import { VStack, Button, Text, useDisclosure } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"

export const StartRound = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId)
  const isCurrentRoundActive = useMemo(() => {
    return currentRound?.state === "0"
  }, [currentRound])
  const { isOpen, onClose, onOpen } = useDisclosure()
  const {
    sendTransaction,
    isTxReceiptLoading,
    sendTransactionPending,
    resetStatus,
    status,
    error,
    txReceipt,
    sendTransactionTx,
  } = useDistributeEmission({})
  const distributionLoading = isTxReceiptLoading || sendTransactionPending

  const handleClose = useCallback(() => {
    resetStatus()
    onClose()
  }, [resetStatus, onClose])

  const handleSubmit = useCallback(() => {
    onOpen()
    sendTransaction(undefined)
  }, [sendTransaction])

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
            onClick={handleSubmit}
            isLoading={distributionLoading}>
            Start new round
          </Button>
        </VStack>
      </VStack>
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={error ? "error" : status}
        successTitle={"Round started!"}
        onTryAgain={handleSubmit}
        showTryAgainButton
        showExplorerButton
        txId={txReceipt?.meta.txID ?? sendTransactionTx?.txid}
        pendingTitle="Starting round..."
        errorTitle={"Error starting round"}
        errorDescription={error?.reason}
      />
    </VStack>
  )
}
