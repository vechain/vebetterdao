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
  showCloseButton?: boolean
  isCloseable?: boolean
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
  showCloseButton = false,
  isCloseable = true,
}: Props) => {
  const [isDesktop] = useMediaQuery("(min-width: 1060px)")

  if (isDesktop)
    return (
      <Modal variant="base" isOpen={isOpen} onClose={onClose} size="xl" isCentered trapFocus={false} {...modalProps}>
        <ModalOverlay />
        <ModalContent rounded={"2xl"} {...modalContentProps}>
          {isCloseable && showCloseButton ? <ModalCloseButton /> : null}
          <ModalBody p={10} rounded={"2xl"} {...modalBodyProps}>
            {children}
          </ModalBody>
        </ModalContent>
      </Modal>
    )

  return (
    <BaseBottomSheet
      {...(modalContentProps?.bgColor ? { customBgColor: modalContentProps.bgColor as string } : {})}
      isOpen={isOpen}
      onClose={onClose}
      ariaTitle={ariaTitle ?? ""}
      isDismissable={isCloseable}
      ariaDescription={ariaDescription ?? ""}>
      {children}
    </BaseBottomSheet>
  )
}
