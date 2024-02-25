import { Heading, VStack, ModalOverlay, Text, ModalCloseButton } from "@chakra-ui/react"
import Lottie from "react-lottie"
import errorAnimation from "./error.json"
import { CustomModalContent } from "../../CustomModalContent"

export type ErrorModalContentProps = {
  title?: ReactNode
  description?: string
}

export const ErrorModalContent = ({
  title = "Error",
  description = "Something went wrong. Please try again.",
}: ErrorModalContentProps) => {
  return (
    <>
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
    </>
  )
}
