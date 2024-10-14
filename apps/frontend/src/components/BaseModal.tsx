import {
  useMediaQuery,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  ModalProps,
  ModalContentProps,
  ModalBodyProps,
} from "@chakra-ui/react"
import { BaseBottomSheet } from "./BaseBottomSheet"

type Props = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  ariaTitle?: string
  ariaDescription?: string
  modalProps?: Partial<ModalProps>
  modalContentProps?: Partial<ModalContentProps>
  modalBodyProps?: Partial<ModalBodyProps>
  closeButton?: boolean
}
export const BaseModal = ({
  isOpen,
  onClose,
  children,
  ariaTitle,
  ariaDescription,
  modalProps,
  modalContentProps,
  modalBodyProps,
  closeButton = true,
}: Props) => {
  const [isDesktop] = useMediaQuery("(min-width: 1060px)")

  if (isDesktop)
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered trapFocus={false} {...modalProps}>
        <ModalOverlay />
        <ModalContent rounded={"2xl"} {...modalContentProps}>
          {closeButton && <ModalCloseButton />}
          <ModalBody p={10} rounded={"2xl"} {...modalBodyProps}>
            {children}
          </ModalBody>
        </ModalContent>
      </Modal>
    )

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      ariaTitle={ariaTitle || ""}
      ariaDescription={ariaDescription || ""}>
      {children}
    </BaseBottomSheet>
  )
}
