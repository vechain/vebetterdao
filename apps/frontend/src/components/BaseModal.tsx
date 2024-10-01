import { useMediaQuery, Modal, ModalOverlay, ModalContent, ModalCloseButton, ModalBody } from "@chakra-ui/react"
import { BaseBottomSheet } from "./BaseBottomSheet"

type Props = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  ariaTitle: string
  ariaDescription: string
}
export const BaseModal = ({ isOpen, onClose, children, ariaTitle, ariaDescription }: Props) => {
  const [isDesktop] = useMediaQuery("(min-width: 1060px)")

  if (isDesktop)
    return (
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={"40px"} borderRadius="xl">
            {children}
          </ModalBody>
        </ModalContent>
      </Modal>
    )

  return (
    <BaseBottomSheet isOpen={isOpen} onClose={onClose} ariaTitle={ariaTitle} ariaDescription={ariaDescription}>
      {children}
    </BaseBottomSheet>
  )
}
