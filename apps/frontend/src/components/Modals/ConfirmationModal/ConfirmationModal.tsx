import { Heading, VStack, ModalOverlay, Text } from "@chakra-ui/react"
import Lottie from "react-lottie"
import confirmationAnimation from "./confirmation.json"
import { CustomModalContent } from "../../CustomModalContent"

export type ConfirmationModalProps = {
  title?: string
  description?: string
}

export const ConfirmationModal = ({
  title = "Waiting for confirmation",
  description = "Please confirm the transaction in your wallet.",
}: ConfirmationModalProps) => {
  return (
    <>
      <ModalOverlay />
      <CustomModalContent zIndex={1}>
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
    </>
  )
}
