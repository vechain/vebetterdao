import { Heading, VStack, Text, Button, Link } from "@chakra-ui/react"
import errorAnimation from "./error.json"
import { ReactNode } from "react"
import { ModalAnimation } from "../ModalAnimation"
import { motion } from "framer-motion"
import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"
import { useTranslation } from "react-i18next"
import Lottie from "react-lottie"

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
          {description && <Text size="sm">{description}</Text>}
          {showExplorerButton && txId && (
            <Link
              href={getExplorerTxLink(txId)}
              isExternal
              color="gray.500"
              fontSize={"14px"}
              textDecoration={"underline"}>
              {t("View it on the explorer")}
            </Link>
          )}
          {showTryAgainButton && (
            <Button variant={"outline"} fontWeight={700} w="full" onClick={onTryAgain}>
              {t("Try again")}
            </Button>
          )}
        </VStack>
      </VStack>
    </ModalAnimation>
  )
}
