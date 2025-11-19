import { Heading, Link, Text, VStack } from "@chakra-ui/react"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import Lottie from "react-lottie"

import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

import loadingAnimation from "./loading.json"

export type LoadingModalContentProps = {
  title?: ReactNode
  description?: ReactNode
  txId?: string
}
export const LoadingModalContent = ({
  title = "Sending Transaction...",
  description,
  txId,
}: LoadingModalContentProps) => {
  const { t } = useTranslation()
  return (
    <VStack align={"center"} textAlign={"center"} p={0} m={0}>
      {/* @ts-ignore eslint-disable-line */}
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
      <Heading data-testid={"tx-modal-title"} size="md">
        {title}
      </Heading>

      {description && (
        <VStack gap={2} mt={4}>
          {typeof description === "string" ? <Text textStyle="sm">{description}</Text> : description}
        </VStack>
      )}

      {txId && (
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
    </VStack>
  )
}
