import { useAllocationsRound, useCurrentAllocationsRoundId } from "@/api"
import { useDistributeEmission } from "@/hooks"
import { VStack, Button, Text } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

export const StartRoundButton = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId)
  const { t } = useTranslation()
  const isCurrentRoundActive = useMemo(() => {
    return currentRound?.state === 0
  }, [currentRound])
  const { sendTransaction, isTransactionPending, status } = useDistributeEmission({})
  const distributionLoading = isTransactionPending || status === "pending"

  const handleSubmit = useCallback(() => {
    sendTransaction()
  }, [sendTransaction])

  if (parseInt(currentRoundId ?? "0") < 1) return null

  return (
    <VStack w="full" gap={4}>
      <VStack w="full" gap={4} alignItems="start">
        <VStack>
          <Text>
            {currentRound.voteEndTimestamp?.isBefore()
              ? t("Last round (#{{currentRoundId}}) ended {{currentRoundEndedAt}}", {
                  currentRoundId: currentRoundId,
                  currentRoundEndedAt: currentRound.voteEndTimestamp?.fromNow(),
                })
              : t("Current round (#{{currentRoundId}}) will end in {{currentRoundEndsAt}}", {
                  currentRoundId: currentRoundId,
                  currentRoundEndsAt: currentRound.voteEndTimestamp?.fromNow(),
                })}
          </Text>
        </VStack>
        <VStack>
          <Button
            colorPalette="blue"
            disabled={isCurrentRoundActive}
            onClick={handleSubmit}
            loading={distributionLoading}
            data-testid={"start-voting-round-button"}>
            {t("Start new round")}
          </Button>
        </VStack>
      </VStack>
    </VStack>
  )
}
