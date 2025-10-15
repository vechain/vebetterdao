import { TransactionStatus } from "@vechain/vechain-kit"
import { ReactNode, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { BaseModal } from "../BaseModal"

import { ErrorModalContent } from "./ErrorModalContent/ErrorModalContent"
import { LoadingModalContent } from "./LoadingModalContent/LoadingModalContent"
import { SuccessModalContent } from "./SuccessModalContent/SuccessModalContent"
import { UnknownModalContent } from "./UnknownModalContent/UnknownModalContent"

export const TransactionModal = () => {
  const { transactionModalState, isTxModalOpen, onClose } = useTransactionModal()
  const { t } = useTranslation()
  const canShowCloseButton = useMemo(() => {
    return transactionModalState?.status !== "pending" && transactionModalState?.status !== "waitingConfirmation"
  }, [transactionModalState?.status])
  const handleTryAgain = useCallback(async () => {
    if (transactionModalState?.tryAgain) {
      return await transactionModalState.tryAgain()
    }
  }, [transactionModalState])
  const getCustomUIProps = useCallback(
    (status: TransactionStatus) => {
      return transactionModalState?.customUI?.[status] || {}
    },
    [transactionModalState?.customUI],
  )
  const modalContent = useMemo(() => {
    const defaultContent = {
      pending: {
        title: t("Waiting for confirmation..."),
        description: t("Confirm the operation in your wallet to complete it"),
      },
      ready: {
        title: t("Transaction Ready"),
        description: t(
          "Transaction status unclear. If you haven't confirmed it in your wallet yet, you can try again. Otherwise, you can close this window and check your transaction history.",
        ),
      },
    }
    const statusComponentMap: Record<TransactionStatus, ReactNode> = {
      pending: <LoadingModalContent {...defaultContent.pending} {...getCustomUIProps("pending")} />,
      waitingConfirmation: <LoadingModalContent {...getCustomUIProps("waitingConfirmation")} />,
      error: (
        <ErrorModalContent
          {...getCustomUIProps("error")}
          showTryAgainButton
          {...(transactionModalState?.error?.reason ? { description: transactionModalState?.error?.reason } : {})}
          {...(transactionModalState?.tryAgain ? { onTryAgain: handleTryAgain } : {})}
        />
      ),
      success: (
        <SuccessModalContent
          {...getCustomUIProps("success")}
          txId={transactionModalState?.txId}
          showSocialButtons={true}
          onClose={onClose}
        />
      ),
      ready: (
        <UnknownModalContent
          {...defaultContent.ready}
          showTryAgainButton
          {...(transactionModalState?.tryAgain ? { onTryAgain: handleTryAgain } : {})}
        />
      ),
      unknown: <UnknownModalContent />,
    }
    return statusComponentMap[transactionModalState?.status ?? "unknown"] || null
  }, [
    t,
    getCustomUIProps,
    transactionModalState?.error?.reason,
    transactionModalState?.tryAgain,
    transactionModalState?.txId,
    transactionModalState?.status,
    handleTryAgain,
    onClose,
  ])

  return (
    <BaseModal
      isOpen={isTxModalOpen}
      onClose={onClose}
      showCloseButton={canShowCloseButton}
      isCloseable={canShowCloseButton}
      modalContentProps={{
        zIndex: 10,
      }}
      modalBodyProps={{
        p: 10,
      }}>
      {modalContent}
    </BaseModal>
  )
}
