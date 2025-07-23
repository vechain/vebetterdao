import { Heading, VStack, Text, ModalCloseButton, Link } from "@chakra-ui/react"
import Lottie from "react-lottie"
import unknownAnimation from "./unknown.json"
import { ReactNode } from "react"
import { ModalAnimation } from "../ModalAnimation"
import { motion } from "framer-motion"
import { getConfig } from "@repo/config"
import { useTranslation } from "react-i18next"

export type UnknownModalContentProps = {
  title?: ReactNode
  description?: ReactNode
  showExplorerButton?: boolean
  txId?: string
}

export const UnknownModalContent = ({
  title = "Unknown status",
  description = "It's not possible to verify the transaction status at the moment. Please check it on the explorer.",
  txId,
  showExplorerButton,
}: UnknownModalContentProps) => {
  const { t } = useTranslation()
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
          {/* @ts-ignore */}
          <Lottie
            style={{
              pointerEvents: "none",
            }}
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
            <Text fontSize={"14px"} textAlign={"center"}>
              {description}
            </Text>
          )}
          {txId && showExplorerButton && (
            <Link
              href={`${getConfig().network.explorerUrl}/txs/${txId}`}
              isExternal
              color="gray.500"
              fontSize={"14px"}
              textDecoration={"underline"}>
              {t("View it on the explorer")}
            </Link>
          )}
        </VStack>
      </VStack>
    </ModalAnimation>
  )
}
