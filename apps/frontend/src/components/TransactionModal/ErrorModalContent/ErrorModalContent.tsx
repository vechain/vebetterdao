import { Heading, VStack, Text, ModalCloseButton, Button } from "@chakra-ui/react"
import Lottie from "react-lottie"
import errorAnimation from "./error.json"
import { ReactNode } from "react"
import { ModalAnimation } from "../ModalAnimation"
import { motion } from "framer-motion"

export type ErrorModalContentProps = {
  title?: ReactNode
  description?: string
  showTryAgainButton?: boolean
  onTryAgain?: () => void
}

export const ErrorModalContent = ({
  title = "Error",
  description = "Something went wrong 😕",
  showTryAgainButton = false,
  onTryAgain = () => {},
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
        <VStack>
          {description && <Text size="sm">{description}</Text>}
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
