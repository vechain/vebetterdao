import { HStack, Icon, Separator, Text } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { ethers } from "ethers"
import { useTranslation } from "react-i18next"

type ResultsDisplayProps = {
  proposalId: string
  segments: { percentage: number; color: string; icon: React.ElementType }[]
  tokenAmount: bigint
  showTokenAmount?: boolean
}
const compactFormatter = getCompactFormatter(2)
export const ResultsDisplay = ({ proposalId, segments, tokenAmount, showTokenAmount = false }: ResultsDisplayProps) => {
  const { t } = useTranslation()

  const isSingleSegment = segments.length === 1
  const hasMultipleSegments = segments.length > 1
  const shouldShowTokenAmount = showTokenAmount && isSingleSegment

  const containerProps = {
    justify: "space-between",
    w: "full",
    gap: isSingleSegment ? 2 : 0,
  } as const

  const segmentProps = {
    gap: 2,
    flex: isSingleSegment ? "none" : "1",
    justify: isSingleSegment ? "flex-start" : "center",
  } as const

  const shouldShowSeparator = (index: number) => {
    return hasMultipleSegments && index !== segments.length - 1
  }

  return (
    <HStack {...containerProps}>
      {segments.map((segment, index) => (
        <>
          <HStack key={`${proposalId}-${segment.color}`} {...segmentProps}>
            <Icon as={segment.icon} boxSize={5} color={segment.color} />
            <Text fontSize="md" color="text.subtle">
              {`${compactFormatter.format(segment.percentage)}%`}
            </Text>
          </HStack>
          {shouldShowSeparator(index) && <Separator orientation="vertical" height="4" />}
        </>
      ))}
      {shouldShowTokenAmount && (
        <Text fontSize="md" color="text.subtle">
          {t("{{amount}} VOT3", { amount: ethers.formatEther(tokenAmount) })}
        </Text>
      )}
    </HStack>
  )
}
