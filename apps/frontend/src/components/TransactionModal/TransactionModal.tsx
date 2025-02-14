import { ReactNode, useCallback, useMemo } from "react"
import { ConfirmationModalContent } from "./ConfirmationModalContent"
import { ConfirmationEndorsementModalContent } from "./ConfirmationModalContent/ConfirmationEndorsementModalContent"
import { ErrorModalContent } from "./ErrorModalContent"
import { LoadingModalContent } from "./LoadingModalContent"
import { SuccessModalContent } from "./SuccessModalContent"
import { Modal, ModalOverlay } from "@chakra-ui/react"
import { CustomModalContent } from "@/components/CustomModalContent"
import { UploadingMetadataModalContent } from ".//UploadingMetadataModalContent"
import { ConfirmationConvertModalContent } from "./ConfirmationConvertModalContent"
import { SuccessConvertModalContent } from "./SuccessConvertModalContent"
import { ConfirmationAppBalanceModalContent } from "./ConfirmationAppBalanceModalContent"
import { SuccessAppBalanceModalContent } from "./SuccessAppBalanceModalContent"
import { CoinsFlipModalContent } from "./CoinsFlipModalContent/CoinsFlipModalContent"
import { PropsEndorsement } from "@/app/apps/components/UnendorseAppModal"

export enum TransactionModalStatus {
  Ready = "ready",
  Pending = "pending",
  WaitingConfirmation = "waitingConfirmation",
  Error = "error",
  Success = "success",
  UploadingMetadata = "uploadingMetadata",
  Unknown = "unknown",
}

export type TransactionModalProps = {
  isOpen: boolean
  onClose: () => void
  status: TransactionModalStatus
  pendingTitle?: ReactNode
  confirmationTitle?: ReactNode
  errorTitle?: ReactNode
  errorDescription?: string
  successTitle?: ReactNode
  showSocialButtons?: boolean
  socialDescriptionEncoded?: string
  showTryAgainButton?: boolean
  onTryAgain?: () => void
  showExplorerButton?: boolean
  txId?: string
  b3trBalanceAfterSwap?: string
  vot3BalanceAfterSwap?: string
  b3trAmount?: string
  isSwap?: boolean
  isClaimingRewards?: boolean
  isAppWithdraw?: boolean
  isAppDeposit?: boolean
  b3trBalance?: string
  vot3Balance?: string
  endorsementInfo?: PropsEndorsement
  isSuccessBeenTrack?: boolean
}

export const TransactionModal = ({
  isOpen,
  onClose,
  status,
  pendingTitle,
  confirmationTitle,
  errorTitle,
  errorDescription,
  successTitle,
  showSocialButtons = false,
  socialDescriptionEncoded,
  showTryAgainButton,
  onTryAgain,
  showExplorerButton,
  txId,
  isSwap,
  isClaimingRewards,
  isAppWithdraw,
  isAppDeposit,
  b3trBalanceAfterSwap,
  vot3BalanceAfterSwap,
  b3trAmount,
  b3trBalance,
  vot3Balance,
  endorsementInfo,
  isSuccessBeenTrack,
}: TransactionModalProps) => {
  const handlePendingStatus = useCallback(() => {
    if (isClaimingRewards) {
      return <CoinsFlipModalContent />
    } else if (isSwap) {
      return (
        <ConfirmationConvertModalContent
          b3trBalanceAfter={b3trBalanceAfterSwap}
          vot3BalanceAfter={vot3BalanceAfterSwap}
        />
      )
    } else if (isAppWithdraw || isAppDeposit) {
      return (
        <ConfirmationAppBalanceModalContent
          b3trBalanceAfter={b3trBalanceAfterSwap}
          b3trAmount={b3trAmount}
          isDeposit={isAppDeposit}
        />
      )
    } else if (endorsementInfo?.isUnendorsing || endorsementInfo?.isEndorsing) {
      return <ConfirmationEndorsementModalContent endorsementInfo={endorsementInfo} />
    } else {
      return <ConfirmationModalContent title={confirmationTitle} />
    }
  }, [
    isClaimingRewards,
    isSwap,
    isAppWithdraw,
    isAppDeposit,
    endorsementInfo,
    b3trBalanceAfterSwap,
    vot3BalanceAfterSwap,
    b3trAmount,
    confirmationTitle,
  ])

  const handleWaitingConfirmationStatus = useCallback(() => {
    return <LoadingModalContent title={pendingTitle} showExplorerButton={showExplorerButton} txId={txId} />
  }, [pendingTitle, showExplorerButton, txId])

  const handleErrorStatus = useCallback(() => {
    return (
      <ErrorModalContent
        title={errorTitle}
        description={errorDescription}
        showTryAgainButton={showTryAgainButton}
        onTryAgain={onTryAgain}
        showExplorerButton={showExplorerButton}
        txId={txId}
      />
    )
  }, [errorTitle, errorDescription, showTryAgainButton, onTryAgain, showExplorerButton, txId])

  const handleSuccessStatus = useCallback(() => {
    if (isSwap) {
      return (
        <SuccessConvertModalContent
          b3trBalanceAfter={b3trBalance}
          vot3BalanceAfter={vot3Balance}
          txId={txId}
          onClose={onClose}
        />
      )
    } else if (isAppWithdraw || isAppDeposit) {
      return (
        <SuccessAppBalanceModalContent
          b3trBalanceAfter={b3trBalance}
          b3trAmount={b3trAmount}
          isDeposit={isAppDeposit}
          txId={txId}
          onClose={onClose}
        />
      )
    } else if (endorsementInfo?.isUnendorsing || endorsementInfo?.isEndorsing) {
      return (
        <SuccessModalContent
          title={successTitle}
          showSocialButtons={showSocialButtons}
          socialDescriptionEncoded={socialDescriptionEncoded}
          showExplorerButton={showExplorerButton}
          txId={txId}
          endorsementInfo={endorsementInfo}
        />
      )
    } else {
      return (
        <SuccessModalContent
          title={successTitle}
          showSocialButtons={showSocialButtons}
          socialDescriptionEncoded={socialDescriptionEncoded}
          showExplorerButton={showExplorerButton}
          txId={txId}
          isSuccessBeenTrack={isSuccessBeenTrack}
        />
      )
    }
  }, [
    b3trAmount,
    b3trBalance,
    endorsementInfo,
    isAppDeposit,
    isAppWithdraw,
    isSuccessBeenTrack,
    isSwap,
    onClose,
    showExplorerButton,
    showSocialButtons,
    socialDescriptionEncoded,
    successTitle,
    txId,
    vot3Balance,
  ])

  const handleReadyStatus = useCallback(() => {
    return <ConfirmationModalContent title={"Transaction Ready"} description="" />
  }, [])

  const handleUnknownStatus = useCallback(() => {
    return <ConfirmationModalContent title={"Unknown Status"} description="" />
  }, [])

  const modalContent = useMemo(() => {
    const statusComponentMap: Record<TransactionModalStatus, ReactNode> = {
      [TransactionModalStatus.UploadingMetadata]: <UploadingMetadataModalContent />,
      [TransactionModalStatus.Pending]: handlePendingStatus(),
      [TransactionModalStatus.WaitingConfirmation]: handleWaitingConfirmationStatus(),
      [TransactionModalStatus.Error]: handleErrorStatus(),
      [TransactionModalStatus.Success]: handleSuccessStatus(),
      [TransactionModalStatus.Ready]: handleReadyStatus(),
      [TransactionModalStatus.Unknown]: handleUnknownStatus(),
    }
    return statusComponentMap[status] || null
  }, [
    handleErrorStatus,
    handlePendingStatus,
    handleReadyStatus,
    handleSuccessStatus,
    handleUnknownStatus,
    handleWaitingConfirmationStatus,
    status,
  ])
  if (!modalContent) return null
  return (
    <Modal
      data-testid="transaction-modal"
      isOpen={isOpen}
      onClose={onClose}
      trapFocus={false}
      closeOnOverlayClick={status !== "waitingConfirmation" && status !== "pending"}
      isCentered={true}>
      <ModalOverlay />
      <CustomModalContent maxW={"590px"} minH={"300px"}>
        {modalContent}
      </CustomModalContent>
    </Modal>
  )
}
