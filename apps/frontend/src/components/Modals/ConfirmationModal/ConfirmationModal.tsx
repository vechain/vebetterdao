import { Heading, VStack, Modal, ModalOverlay, Text, ModalCloseButton } from "@chakra-ui/react"
import Lottie from "react-lottie"
import confirmationAnimation from "./confirmation.json"
import { CustomModalContent } from "../../CustomModalContent"

export type ConfirmationModalProps = {
  isOpen: boolean
  onClose?: () => void
  title?: string
  description?: string
}

export const ConfirmationModal = ({
  isOpen,
  title = "Waiting for confirmation",
  description = "Please confirm the transaction in your wallet.",
  onClose = () => {},
}: ConfirmationModalProps) => {
  return (
    <Modal isOpen={isOpen} trapFocus={true} isCentered={true} onClose={onClose}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalCloseButton top={4} right={4} />
        <VStack align={"center"} p={6} gap={6}>
          <Heading size="md">{title}</Heading>
          <Lottie
            options={{
              loop: true,
              autoplay: true,
              animationData: confirmationAnimation,
            }}
            height={200}
            width={200}
          />
          {description && <Text size="sm">{description}</Text>}
        </VStack>
      </CustomModalContent>
    </Modal>
  )
}
