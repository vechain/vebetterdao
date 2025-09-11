import { VStack, Button, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { useStartRoundAndClaimWorkflow } from "@/hooks/useStartRoundAndClaimWorkflow"
import { useCurrentRoundActiveState } from "@/api"

interface StartRoundButtonProps {
  redirectTo?: string
  onSuccess?: () => void
}

export const StartRoundButton = ({ redirectTo, onSuccess }: StartRoundButtonProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { isCurrentRoundActive, currentRound, currentRoundId } = useCurrentRoundActiveState()

  const { sendTransaction, isTransactionPending, status, xAppsLeftCount } = useStartRoundAndClaimWorkflow({
    roundId: currentRoundId ?? "",
    onSuccess: () => {
      onSuccess?.()
      if (redirectTo) {
        router.push(redirectTo)
      }
    },
  })

  if (parseInt(currentRoundId ?? "0") < 1) return null

  const getButtonText = () => {
    if (isTransactionPending) {
      return t("Processing transaction...")
    }

    if (status === "success") {
      return t("Transaction completed!")
    }

    return t("Start new round & claim allocations")
  }

  return (
    <VStack w="full" gap={4}>
      {xAppsLeftCount > 0 && (
        <Text>
          {t("By clicking the button below, you will also claim allocations for {{count}} apps.", {
            count: xAppsLeftCount,
          })}
        </Text>
      )}
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
            disabled={isCurrentRoundActive || isTransactionPending || status === "success"}
            onClick={() => sendTransaction()}
            loading={isTransactionPending}
            data-testid="start-voting-round-button">
            {getButtonText()}
          </Button>
        </VStack>
      </VStack>
    </VStack>
  )
}
