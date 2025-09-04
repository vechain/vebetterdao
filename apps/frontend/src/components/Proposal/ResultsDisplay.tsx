import { HStack, Icon, Text } from "@chakra-ui/react"
import { ethers } from "ethers"
import { useTranslation } from "react-i18next"
import { FaHeart, FaRegHeart } from "react-icons/fa"

interface ResultsDisplayProps {
  percentage: string
  hasVoted: boolean
  tokenAmount: bigint
  showTokenAmount?: boolean
  layout?: "horizontal" | "vertical"
}

export const ResultsDisplay = ({
  percentage,
  hasVoted,
  tokenAmount,
  showTokenAmount = false,
  layout = "horizontal",
}: ResultsDisplayProps) => {
  const { t } = useTranslation()

  const content = (
    <>
      <HStack color="success.primary">
        <Icon as={hasVoted ? FaHeart : FaRegHeart} boxSize={5} />
        <Text>{`${percentage}%`}</Text>
      </HStack>
      {showTokenAmount && (
        <Text fontSize="md" color="text.subtle">
          {t("{{amount}} VOT3", { amount: ethers.formatEther(tokenAmount) })}
        </Text>
      )}
    </>
  )

  if (layout === "vertical") {
    return <div>{content}</div>
  }

  return <HStack justify={showTokenAmount ? "space-between" : "flex-start"}>{content}</HStack>
}
