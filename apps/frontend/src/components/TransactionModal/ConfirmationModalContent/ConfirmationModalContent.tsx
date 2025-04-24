import { Heading, VStack, Text } from "@chakra-ui/react"
import LazyLottie from "@/app/components/LazyLottie"
import confirmationAnimation from "./confirmation.json"
import { ReactNode } from "react"

export type ConfirmationModalContentProps = {
  title?: ReactNode
  description?: string
}

export const ConfirmationModalContent = ({
  title = "Waiting for confirmation",
  description = "Please confirm the transaction in your wallet.",
}: ConfirmationModalContentProps) => {
  return (
    <VStack align={"center"} p={6} gap={6}>
      <Heading size="md" data-testid={"tx-modal-title"}>
        {title}
      </Heading>
      <LazyLottie
        style={{
          pointerEvents: "none",
        }}
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
  )
}
