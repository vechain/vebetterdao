import { BaseModal } from "../BaseModal"
import { Text } from "@chakra-ui/react"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { ReactNode, useMemo, useRef, useCallback } from "react"
import { TransactionStatus } from "@vechain/vechain-kit"
import { SuccessModalContent } from "../TransactionModal/SuccessModalContent"
import { ErrorModalContent } from "../TransactionModal/ErrorModalContent"
import { LoadingModalContent } from "../TransactionModal/LoadingModalContent"
import { ConfirmationModalContent } from "../TransactionModal/ConfirmationModalContent"
export const TransactionModalV2 = () => {
  const { transactionState, isTxModalOpen, onClose } = useTransactionModal()
  const portalRef = useRef(document.body)
  const canShowCloseButton = useMemo(() => {
    return transactionState?.status !== "pending" && transactionState?.status !== "waitingConfirmation"
  }, [transactionState?.status])

  const handleTryAgain = useCallback(async () => {
    if (transactionState?.tryAgain) {
      return await transactionState.tryAgain()
    }
  }, [transactionState?.tryAgain])

  const modalContent = useMemo(() => {
    const statusComponentMap: Record<TransactionStatus, ReactNode> = {
      pending: <ConfirmationModalContent />,
      waitingConfirmation: <LoadingModalContent />,
      error: (
        <ErrorModalContent showTryAgainButton {...(transactionState?.tryAgain ? { onTryAgain: handleTryAgain } : {})} />
      ),
      success: <SuccessModalContent />,
      ready: null,
      unknown: null,
    }
    return statusComponentMap[transactionState?.status ?? "unknown"] || null
  }, [transactionState?.status, transactionState?.tryAgain, handleTryAgain])

  if (transactionState?.status === "ready") return null

  return (
    <BaseModal
      isOpen={isTxModalOpen}
      onClose={onClose}
      modalProps={{
        portalProps: {
          containerRef: portalRef,
        },
      }}
      closeButton={canShowCloseButton}
      modalContentProps={{
        zIndex: 9999,
      }}>
      {modalContent}
      <Text>{JSON.stringify(transactionState)}</Text>
    </BaseModal>
  )
}
