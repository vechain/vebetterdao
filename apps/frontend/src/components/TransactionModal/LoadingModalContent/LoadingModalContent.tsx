import { Heading, Link, VStack } from "@chakra-ui/react"
import Lottie from "react-lottie"
import loadingAnimation from "./loading.json"
import { ReactNode } from "react"
import { ModalAnimation } from "../ModalAnimation"
import { useTranslation } from "react-i18next"
import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

export type LoadingModalContentProps = {
  title?: ReactNode
  showExplorerButton?: boolean
  txId?: string
}

export const LoadingModalContent = ({
  title = "Sending Transaction...",
  showExplorerButton = true,
  txId,
}: LoadingModalContentProps) => {
  const { t } = useTranslation()
  return (
    <ModalAnimation>
      <VStack align={"center"} p={6}>
        <Heading data-testid={"tx-modal-title"} size="md">
          {title}
        </Heading>
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
            href={getExplorerTxLink(txId)}
            isExternal
            color="gray.500"
            fontSize={"14px"}
            textDecoration={"underline"}>
            {t("View it on the explorer")}
          </Link>
        )}
      </VStack>
    </ModalAnimation>
  )
}
