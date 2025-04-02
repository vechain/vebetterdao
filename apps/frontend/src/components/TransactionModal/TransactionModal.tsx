import { ReactNode, useMemo } from "react"
import { ConfirmationModalContent } from "./ConfirmationModalContent"
import { ErrorModalContent } from "./ErrorModalContent"
import { LoadingModalContent } from "./LoadingModalContent"
import { SuccessModalContent } from "./SuccessModalContent"
import { Modal, ModalOverlay } from "@chakra-ui/react"
import { CustomModalContent } from "@/components/CustomModalContent"
import { UploadingMetadataModalContent } from "./UploadingMetadataModalContent"
import { UnknownModalContent } from "./UnknownModalContent"

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
  titles?: Partial<Record<TransactionModalStatus, ReactNode>>
  status: TransactionModalStatus
  errorDescription?: string
  showSocialButtons?: boolean
  socialDescriptionEncoded?: string
  onTryAgain?: () => void
  showExplorerButton?: boolean
  txId?: string
  customContent?: Partial<Record<TransactionModalStatus, ReactNode>>
}

const defaultModalContent = (
  status: TransactionModalStatus,
  props: Omit<TransactionModalProps, "customContent">,
): ReactNode => {
  const { titles } = props

  const contentMap: Record<TransactionModalStatus, ReactNode> = {
    [TransactionModalStatus.UploadingMetadata]: (
      <UploadingMetadataModalContent title={titles?.[TransactionModalStatus.UploadingMetadata]} />
    ),
    [TransactionModalStatus.Pending]: (
      <ConfirmationModalContent title={titles?.[TransactionModalStatus.Pending]} {...props} />
    ),
    [TransactionModalStatus.WaitingConfirmation]: (
      <LoadingModalContent title={titles?.[TransactionModalStatus.WaitingConfirmation]} {...props} />
    ),
    [TransactionModalStatus.Error]: <ErrorModalContent title={titles?.[TransactionModalStatus.Error]} {...props} />,
    [TransactionModalStatus.Success]: (
      <SuccessModalContent title={titles?.[TransactionModalStatus.Success]} {...props} />
    ),
    [TransactionModalStatus.Ready]: (
      <ConfirmationModalContent title={titles?.[TransactionModalStatus.Ready]} {...props} />
    ),
    [TransactionModalStatus.Unknown]: (
      <UnknownModalContent title={titles?.[TransactionModalStatus.Unknown]} {...props} />
    ),
  }

  return contentMap[status] || null
}

export const TransactionModal = ({ isOpen, onClose, status, customContent, ...rest }: TransactionModalProps) => {
  // Dynamically handle default and custom modal, expecting custom content to provide required props
  const modalContent = useMemo(() => {
    return customContent?.[status] || defaultModalContent(status, { isOpen, onClose, status, ...rest })
  }, [status, customContent, isOpen, onClose, rest])

  if (!modalContent) return <UnknownModalContent {...rest} />

  return (
    <Modal
      data-testid="transaction-modal"
      isOpen={isOpen}
      onClose={onClose}
      trapFocus={false}
      closeOnOverlayClick={
        status !== TransactionModalStatus.WaitingConfirmation && status !== TransactionModalStatus.Pending
      }
      isCentered>
      <ModalOverlay />
      <CustomModalContent maxW="590px" minH="300px">
        {modalContent}
      </CustomModalContent>
    </Modal>
  )
}
