import { Heading, VStack, Modal, ModalOverlay, Text, ModalCloseButton } from "@chakra-ui/react"
import Lottie from "react-lottie"
import errorAnimation from "./error.json"
import { CustomModalContent } from "../../CustomModalContent"

export type ErrorModalProps = {
  isOpen: boolean
  onClose?: () => void
  title?: string
  description?: string
}

export const ErrorModal = ({
  isOpen,
  title = "Error",
  description = "Something went wrong. Please try again.",
  onClose = () => {},
}: ErrorModalProps) => {
  return (
    <Modal isOpen={isOpen} trapFocus={true} isCentered={true} onClose={onClose}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalCloseButton top={4} right={4} />
        <VStack align={"center"} p={6} gap={0}>
          <Heading size="md">{title}</Heading>
          <Lottie
            options={{
              loop: true,
              autoplay: true,
              animationData: errorAnimation,
            }}
            height={250}
            width={250}
          />
          {description && <Text size="sm">{description}</Text>}
        </VStack>
      </CustomModalContent>
    </Modal>
  )
}
