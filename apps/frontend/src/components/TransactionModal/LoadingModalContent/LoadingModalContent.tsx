import { Button, Heading, VStack } from "@chakra-ui/react"
import Lottie from "react-lottie"
import loadingAnimation from "./loading.json"
import { ReactNode } from "react"
import { ModalAnimation } from "../ModalAnimation"
import { getConfig } from "@repo/config"

export type LoadingModalContentProps = {
  title?: ReactNode
  showExplorerButton?: boolean
  txId?: string
}

export const LoadingModalContent = ({
  title = "Sending Transaction...",
  showExplorerButton,
  txId,
}: LoadingModalContentProps) => {
  return (
    <ModalAnimation>
      <VStack align={"center"} p={6}>
        <Heading size="md">{title}</Heading>
        <Lottie
          style={{
            pointerEvents: "none",
          }}
          options={{
            loop: true,
            autoplay: true,
            animationData: loadingAnimation,
          }}
          height={200}
          width={200}
        />
        {showExplorerButton && txId && (
          <Button
            variant={"link"}
            onClick={() => {
              window.open(`${getConfig().network.explorerUrl}/txs/${txId}`, "_blank")
            }}
            size="sm"
            textDecoration={"underline"}>
            View it on the explorer
          </Button>
        )}
      </VStack>
    </ModalAnimation>
  )
}
