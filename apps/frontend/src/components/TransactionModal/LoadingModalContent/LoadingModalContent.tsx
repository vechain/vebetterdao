import { Heading, Link, VStack } from "@chakra-ui/react"
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
          <Link
            href={`${getConfig().network.explorerUrl}/txs/${txId}`}
            isExternal
            color="gray.500"
            fontSize={"14px"}
            textDecoration={"underline"}>
            View it on the explorer
          </Link>
        )}
      </VStack>
    </ModalAnimation>
  )
}
