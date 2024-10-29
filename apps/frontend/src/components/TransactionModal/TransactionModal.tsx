import { ReactNode, useMemo } from "react"
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

export type TransactionModalProps = {
  isOpen: boolean
  onClose: () => void
  status: string
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
  const modalContent = useMemo(() => {
    if (status === "uploadingMetadata") return <UploadingMetadataModalContent />

    if (status === "pending") {
      if (isClaimingRewards) return <CoinsFlipModalContent />
      if (isSwap)
        return (
          <ConfirmationConvertModalContent
            b3trBalanceAfter={b3trBalanceAfterSwap}
            vot3BalanceAfter={vot3BalanceAfterSwap}
          />
        )

      if (isAppWithdraw || isAppDeposit)
        return (
          <ConfirmationAppBalanceModalContent
            b3trBalanceAfter={b3trBalanceAfterSwap}
            b3trAmount={b3trAmount}
            isDeposit={isAppDeposit}
          />
        )

      if (endorsementInfo?.isUnendorsing || endorsementInfo?.isEndorsing) {
        return <ConfirmationEndorsementModalContent endorsementInfo={endorsementInfo} />
      }

      return <ConfirmationModalContent title={confirmationTitle} />
    }
    if (status === "waitingConfirmation")
      return <LoadingModalContent title={pendingTitle} showExplorerButton={showExplorerButton} txId={txId} />
    if (status === "error")
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
    if (status === "success") {
      if (isSwap)
        return (
          <SuccessConvertModalContent
            b3trBalanceAfter={b3trBalance}
            vot3BalanceAfter={vot3Balance}
            txId={txId}
            onClose={onClose}
          />
        )

      if (isAppWithdraw || isAppDeposit)
        return (
          <SuccessAppBalanceModalContent
            b3trBalanceAfter={b3trBalance}
            b3trAmount={b3trAmount}
            isDeposit={isAppDeposit}
            txId={txId}
            onClose={onClose}
          />
        )
      if (endorsementInfo?.isUnendorsing || endorsementInfo?.isEndorsing) {
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
      }

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
    return null
  }, [
    status,
    isSwap,
    isClaimingRewards,
    isAppWithdraw,
    b3trBalanceAfterSwap,
    vot3BalanceAfterSwap,
    confirmationTitle,
    pendingTitle,
    showExplorerButton,
    txId,
    errorTitle,
    errorDescription,
    showTryAgainButton,
    onTryAgain,
    b3trBalance,
    vot3Balance,
    onClose,
    successTitle,
    showSocialButtons,
    socialDescriptionEncoded,
    b3trAmount,
    isAppDeposit,
    endorsementInfo,
    isSuccessBeenTrack,
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
