import { Heading, Text, VStack } from "@chakra-ui/react"
import LazyLottie from "@/app/components/LazyLottie"
import UploadingMetadataAnimation from "./uploadingMetadata.json"
import { ReactNode } from "react"
import { ModalAnimation } from "../ModalAnimation"

export type LoadingModalContentProps = {
  title?: ReactNode
  description?: ReactNode
}

export const UploadingMetadataModalContent = ({
  title = "Uploading metadata...",
  description = "Please wait while we upload the metadata",
}: LoadingModalContentProps) => {
  return (
    <ModalAnimation>
      <VStack align={"center"} p={6}>
        <Heading size="md">{title}</Heading>
        <LazyLottie
          style={{
            pointerEvents: "none",
          }}
          options={{
            loop: true,
            autoplay: true,
            animationData: UploadingMetadataAnimation,
          }}
          height={200}
          width={200}
        />
        <Text>{description}</Text>
      </VStack>
    </ModalAnimation>
  )
}
