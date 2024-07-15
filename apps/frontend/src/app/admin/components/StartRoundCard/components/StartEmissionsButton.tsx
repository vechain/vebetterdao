import { useCurrentAllocationsRoundId } from "@/api"
import { TransactionModal } from "@/components/TransactionModal"
import { useStartEmission } from "@/hooks"
import { HStack, Button, useDisclosure } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

export const StartEmissionsButton = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const { t } = useTranslation()
  const {
    sendTransaction,
    resetStatus,
    isTxReceiptLoading,
    sendTransactionPending,
    status,
    error,
    txReceipt,
    sendTransactionTx,
  } = useStartEmission({})

  const handleStartEmissions = useCallback(() => {
    sendTransaction(undefined)
    onOpen()
  }, [sendTransaction, onOpen])

  const handleClose = useCallback(() => {
    resetStatus()
    onClose()
  }, [resetStatus, onClose])

  const loading = isTxReceiptLoading || sendTransactionPending

  if (parseInt(currentRoundId ?? "0") > 0) return null

  return (
    <HStack spacing={12}>
      <Button
        isDisabled={parseInt(currentRoundId ?? "0") > 0}
        colorScheme="blue"
        onClick={handleStartEmissions}
        isLoading={loading}>
        {t("Start emissions")}
      </Button>

      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={error ? "error" : status}
        successTitle={"Emissions and rounds started!"}
        onTryAgain={handleStartEmissions}
        showTryAgainButton
        showExplorerButton
        txId={txReceipt?.meta.txID ?? sendTransactionTx?.txid}
        pendingTitle="Starting emissions and rounds..."
        errorTitle={"Error starting emissions and rounds"}
        errorDescription={error?.reason}
      />
    </HStack>
  )
}
