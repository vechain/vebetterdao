import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody } from "@chakra-ui/react"

type Props = {
  isOpen: boolean
  onClose: () => void
}
export const CreateProposalModal: React.FC<Props> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create new proposal</ModalHeader>

        <ModalCloseButton />
        <ModalBody></ModalBody>
      </ModalContent>
    </Modal>
  )
}
