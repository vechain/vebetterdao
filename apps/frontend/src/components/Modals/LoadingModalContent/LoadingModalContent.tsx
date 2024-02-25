import { Heading, VStack, Modal, ModalOverlay } from "@chakra-ui/react"
import Lottie from "react-lottie"
import loadingAnimation from "./loading.json"
import { CustomModalContent } from "../../CustomModalContent"
import { ReactNode } from "react"

export type LoadingModalContentProps = {
  title?: ReactNode
}

export const LoadingModalContent = ({ title = "Sending Transaction..." }: LoadingModalContentProps) => {
  return (
    <>
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
    </>
  )
}
