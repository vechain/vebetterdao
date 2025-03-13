import { useAllocationsRound, useCurrentAllocationsRoundId } from "@/api"
import { TransactionModal, TransactionModalStatus } from "@/components/TransactionModal"
import { useDistributeEmission } from "@/hooks"
import { VStack, Button, Text, useDisclosure } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

export const StartRoundButton = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId)
  const { t } = useTranslation()
  const isCurrentRoundActive = useMemo(() => {
    return currentRound?.state === 0
  }, [currentRound])
  const { isOpen, onClose, onOpen } = useDisclosure()
  const { sendTransaction, isTransactionPending, resetStatus, status, error, txReceipt } = useDistributeEmission({})
  const distributionLoading = isTransactionPending || status === "pending"

  const handleClose = useCallback(() => {
    resetStatus()
    onClose()
  }, [resetStatus, onClose])

  const handleSubmit = useCallback(() => {
    onOpen()
    sendTransaction(undefined)
  }, [onOpen, sendTransaction])

  if (parseInt(currentRoundId ?? "0") < 1) return null

  return (
    <VStack w="full" spacing={4}>
      <VStack w="full" spacing={4} alignItems="start">
        <VStack>
          <Text>
            {currentRound.voteEndTimestamp?.isBefore()
              ? t("Last round (#{{currentRoundId}}) ended {{currentRoundEndedAt}}", {
                  currentRoundId: currentRoundId,
                  currentRoundEndedAt: currentRound.voteEndTimestamp?.fromNow(),
                })
              : t("Current round (#{{currentRoundId}}) will end in {{currentRoundEndsAt}}", {
                  currentRoundId: currentRoundId,
                  currentRoundEndsAt: currentRound.voteEndTimestamp?.fromNow(),
                })}
          </Text>
        </VStack>
        <VStack>
          <Button
            colorScheme="blue"
            isDisabled={isCurrentRoundActive}
            onClick={handleSubmit}
            isLoading={distributionLoading}
            data-testid={"start-voting-round-button"}>
            {t("Start new round")}
          </Button>
        </VStack>
      </VStack>
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={error ? TransactionModalStatus.Error : (status as TransactionModalStatus)}
        onTryAgain={handleSubmit}
        showExplorerButton
        txId={txReceipt?.meta.txID}
        errorDescription={error?.reason}
        data-testid={"round-start-modal-title"}
        titles={{
          [TransactionModalStatus.Success]: "Round started!",
          [TransactionModalStatus.Error]: "Error starting round",
          [TransactionModalStatus.Pending]: "Starting round...",
        }}
      />
    </VStack>
  )
}
