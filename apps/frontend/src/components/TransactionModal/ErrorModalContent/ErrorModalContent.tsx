import { Heading, VStack, Text, Button, Link } from "@chakra-ui/react"
import { motion } from "framer-motion"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import Lottie from "react-lottie"

import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

import { ModalAnimation } from "../ModalAnimation"

import errorAnimation from "./error.json"

export type ErrorModalContentProps = {
  title?: ReactNode
  description?: string
  showTryAgainButton?: boolean
  onTryAgain?: () => Promise<void>
  showExplorerButton?: boolean
  txId?: string
}
export const ErrorModalContent = ({
  title = "Error",
  description = "Something went wrong 😕",
  showTryAgainButton = false,
  onTryAgain,
  showExplorerButton,
  txId,
}: ErrorModalContentProps) => {
  const { t } = useTranslation()
  return (
    <ModalAnimation>
      <VStack align={"center"} p={0} gap={0}>
        <Heading size="md" data-testid={"tx-modal-title"}>
          {title}
        </Heading>
        <motion.div
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}>
          {/* @ts-ignore eslint-disable-line */}
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
          {description && <Text textStyle="sm">{description}</Text>}
          {showExplorerButton && txId && (
            <Link
              href={getExplorerTxLink(txId)}
              target="_blank"
              rel="noopener noreferrer"
              color="gray.500"
              textStyle="sm"
              textDecoration={"underline"}>
              {t("View it on the explorer")}
            </Link>
          )}
          {showTryAgainButton && (
            <Button variant={"outline"} w="full" onClick={onTryAgain}>
              {t("Try again")}
            </Button>
          )}
        </VStack>
      </VStack>
    </ModalAnimation>
  )
}
