import { Heading, Link, Text, VStack } from "@chakra-ui/react"
import loadingAnimation from "./loading.json"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"
import Lottie from "react-lottie"

export type LoadingModalContentProps = {
  title?: ReactNode
  description?: string
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
      {description && <Text size="sm">{description}</Text>}
      {txId && (
        <Link href={getExplorerTxLink(txId)} isExternal color="gray.500" fontSize={"14px"} textDecoration={"underline"}>
          {t("View it on the explorer")}
        </Link>
      )}
    </VStack>
  )
}
