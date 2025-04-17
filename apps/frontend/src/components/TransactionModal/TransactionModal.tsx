import { BaseModal } from "../BaseModal"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { ReactNode, useMemo, useRef, useCallback } from "react"
import { TransactionStatus } from "@vechain/vechain-kit"
import { SuccessModalContent } from "./SuccessModalContent"
import { ErrorModalContent } from "./ErrorModalContent"
import { LoadingModalContent } from "./LoadingModalContent"
import { UnknownModalContent } from "./UnknownModalContent"
export const TransactionModal = () => {
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
      //Waiting for user confirmation
      pending: (
        <LoadingModalContent
          title="Waiting for confirmation..."
          description="Confirm the operation in your wallet to complete it"
        />
      ),
      waitingConfirmation: <LoadingModalContent />, //Waiting for confirmation from the network
      error: (
        <ErrorModalContent
          showTryAgainButton
          {...(transactionModalState?.tryAgain ? { onTryAgain: handleTryAgain } : {})}
        />
      ),
      success: <SuccessModalContent txId={transactionModalState?.txId} showSocialButtons={true} />,
      ready: (
        <UnknownModalContent
          title="Transaction Ready"
          description="Transaction status unclear. If you haven't confirmed it in your wallet yet, you can try again. Otherwise, you can close this window and check your transaction history."
          showTryAgainButton
          {...(transactionModalState?.tryAgain ? { onTryAgain: handleTryAgain } : {})}
        />
      ),
      unknown: <UnknownModalContent />,
    }
    return statusComponentMap[transactionModalState?.status ?? "unknown"] || null
  }, [transactionModalState?.status, transactionModalState?.tryAgain, handleTryAgain, transactionModalState?.txId])

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
