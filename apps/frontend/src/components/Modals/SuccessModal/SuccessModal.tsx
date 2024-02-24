import { Heading, Text, VStack, Modal, ModalOverlay, ModalCloseButton } from "@chakra-ui/react"
import Lottie from "react-lottie"
import successAnimation from "./success.json"
import { ShareButtons } from "../../ShareButtons"
import { CustomModalContent } from "../../CustomModalContent"

export type SuccessModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  showSocialButtons?: boolean
  socialDescription?: string
}

/**
 * SuccessModal is a component that shows a success message with a lottie animation and share buttons
 * @param {SuccessModalProps} props - The props of the component
 * @param {boolean} props.isOpen - A boolean to control the visibility of the modal
 * @param {() => void} props.onClose - A function to close the modal
 * @param {string} props.title - The title of the modal
 * @param {string} props.socialDescription - The description to share on social media
 * @returns {React.ReactElement} The SuccessModal component
 */
export const SuccessModal = ({
  isOpen,
  onClose,
  title,
  showSocialButtons = false,
  socialDescription = "I've just completed a transaction on B3tr. Check it out!",
}: SuccessModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalCloseButton top={4} right={4} />
        <VStack align={"center"} p={6}>
          <Heading size="md">{title}</Heading>
          <Lottie
            style={{
              pointerEvents: "none",
            }}
            options={{
              loop: true,
              autoplay: true,
              animationData: successAnimation,
            }}
            height={200}
            width={200}
          />
          {showSocialButtons && (
            <VStack>
              <Text fontSize="sm">Share your success on social media</Text>
              <ShareButtons description={socialDescription} />
            </VStack>
          )}
        </VStack>
      </CustomModalContent>
    </Modal>
  )
}
