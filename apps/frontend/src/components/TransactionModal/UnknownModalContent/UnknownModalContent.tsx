import { Heading, VStack, Text, Link, Button } from "@chakra-ui/react"
import unknownAnimation from "./unknown.json"
import { ReactNode } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"
import Lottie from "react-lottie"

export type UnknownModalContentProps = {
  title?: ReactNode
  description?: string
  showTryAgainButton?: boolean
  onTryAgain?: () => Promise<void>
  showExplorerButton?: boolean
  txId?: string
}

export const UnknownModalContent = ({
  title = "Unknown status",
  description = "It's not possible to verify the transaction status at the moment. Please check it on the explorer.",
  txId,
  showExplorerButton,
  showTryAgainButton,
  onTryAgain,
}: UnknownModalContentProps) => {
  const { t } = useTranslation()
  return (
    <VStack align={"center"}>
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
        {/* @ts-ignore eslint-disable-line */}
        <Lottie
          style={{ pointerEvents: "none" }}
          options={{
            loop: false,
            autoplay: true,
            animationData: unknownAnimation,
          }}
          height={260}
          width={260}
        />
      </motion.div>
      <VStack gap={4}>
        {description && (
          <Text textStyle={"sm"} textAlign={"center"}>
            {description}
          </Text>
        )}
        {txId && showExplorerButton && (
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
          <Button variant={"outline"} onClick={onTryAgain}>
            {t("Send transaction")}
          </Button>
        )}
      </VStack>
    </VStack>
  )
}
