import { BaseModal } from "../BaseModal"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { ReactNode, useMemo, useRef, useCallback } from "react"
import { TransactionStatus } from "@vechain/vechain-kit"
import { SuccessModalContent } from "../TransactionModal/SuccessModalContent"
import { ErrorModalContent } from "../TransactionModal/ErrorModalContent"
import { LoadingModalContent } from "../TransactionModal/LoadingModalContent"
import { ConfirmationModalContent } from "../TransactionModal/ConfirmationModalContent"
export const TransactionModalV2 = () => {
  const { transactionModalState, isTxModalOpen, onClose } = useTransactionModal()
  const portalRef = useRef(document.body)
  const canShowCloseButton = useMemo(() => {
    return transactionModalState?.status !== "pending" && transactionModalState?.status !== "waitingConfirmation"
  }, [transactionModalState?.status])

  const handleTryAgain = useCallback(async () => {
    if (transactionModalState?.tryAgain) {
      return await transactionModalState.tryAgain()
    }
  }, [transactionModalState])

  const modalContent = useMemo(() => {
    const statusComponentMap: Record<TransactionStatus, ReactNode> = {
      pending: <ConfirmationModalContent />,
      waitingConfirmation: <LoadingModalContent />,
      error: (
        <ErrorModalContent
          showTryAgainButton
          {...(transactionModalState?.tryAgain ? { onTryAgain: handleTryAgain } : {})}
        />
      ),
      success: <SuccessModalContent />,
      ready: null,
      unknown: null,
    }
    return statusComponentMap[transactionModalState?.status ?? "unknown"] || null
  }, [transactionModalState?.status, transactionModalState?.tryAgain, handleTryAgain])

  if (transactionModalState?.status === "ready") return null

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
    </BaseModal>
  )
}
