import { Heading, VStack, Text, ModalCloseButton, Button } from "@chakra-ui/react"
import Lottie from "react-lottie"
import errorAnimation from "./error.json"
import { ReactNode } from "react"
import { ModalAnimation } from "../ModalAnimation"
import { motion } from "framer-motion"
import { getConfig } from "@repo/config"

export type ErrorModalContentProps = {
  title?: ReactNode
  description?: string
  showTryAgainButton?: boolean
  onTryAgain?: () => void
  showExplorerButton?: boolean
  txId?: string
}

export const ErrorModalContent = ({
  title = "Error",
  description = "Something went wrong 😕",
  showTryAgainButton = false,
  onTryAgain = () => {},
  showExplorerButton,
  txId,
}: ErrorModalContentProps) => {
  return (
    <ModalAnimation>
      <ModalCloseButton top={4} right={4} />
      <VStack align={"center"} p={6} gap={0}>
        <Heading size="md">{title}</Heading>
        <motion.div
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}>
          <Lottie
            style={{
              pointerEvents: "none",
            }}
            options={{
              loop: false,
              autoplay: true,
              animationData: errorAnimation,
            }}
            height={260}
            width={260}
          />
        </motion.div>
        <VStack gap={4}>
          {description && <Text size="sm">{description}</Text>}
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
          {showTryAgainButton && (
            <Button variant={"outline"} onClick={onTryAgain}>
              Try again
            </Button>
          )}
        </VStack>
      </VStack>
    </ModalAnimation>
  )
}
