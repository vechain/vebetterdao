import { Heading, VStack, Modal, ModalOverlay } from "@chakra-ui/react"
import Lottie from "react-lottie"
import loadingAnimation from "./loading.json"
import { CustomModalContent } from "../../CustomModalContent"

export type LoadingModalProps = {
  isOpen: boolean
  onClose?: () => void
  title?: string
}

export const LoadingModal = ({ isOpen, title = "Sending Transaction...", onClose = () => {} }: LoadingModalProps) => {
  return (
    <Modal isOpen={isOpen} trapFocus={true} isCentered={true} closeOnOverlayClick={false} onClose={onClose}>
      <ModalOverlay />
      <CustomModalContent>
        <VStack align={"center"} p={6}>
          <Heading size="md">{title}</Heading>
          <Lottie
            options={{
              loop: true,
              autoplay: true,
              animationData: loadingAnimation,
            }}
            height={200}
            width={200}
          />
        </VStack>
      </CustomModalContent>
    </Modal>
  )
}
