import { Badge as ChakraBadge, HStack, Icon, Skeleton, Text } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaClock } from "react-icons/fa6"
import { IoCheckmarkCircle } from "react-icons/io5"
import { MdHowToVote } from "react-icons/md"

import { useCurrentAllocationsRoundId } from "../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useIsAutoVotingEnabled } from "../../api/contracts/xAllocations/hooks/useIsAutoVotingEnabled"
import { useIsAutoVotingEnabledForRound } from "../../api/contracts/xAllocations/hooks/useIsAutoVotingEnabledForRound"

type AutomationStatus = "active" | "pending" | "manual"

type Props = {
  roundId: string
}

export const AutomationStatusBadge = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: isAutoVotingEnabled, isLoading: isAutoVotingEnabledLoading } = useIsAutoVotingEnabled(account?.address)
  const { data: isAutoVotingEnabledForRound, isLoading: isAutoVotingEnabledForRoundLoading } =
    useIsAutoVotingEnabledForRound(account?.address, roundId)

  const isCurrentRound = roundId === currentRoundId

  const status: AutomationStatus = useMemo(() => {
    // Active: Was enabled at this round's snapshot
    if (isAutoVotingEnabledForRound) return "active"
    // Pending: Only for current round - not enabled at snapshot but enabled now (will start next round)
    if (isCurrentRound && !isAutoVotingEnabledForRound && isAutoVotingEnabled) return "pending"
    // Manual: Not enabled at this round's snapshot
    return "manual"
  }, [isAutoVotingEnabled, isAutoVotingEnabledForRound, isCurrentRound])

  const isLoading = isAutoVotingEnabledLoading || isAutoVotingEnabledForRoundLoading

  const config = useMemo(() => {
    switch (status) {
      case "active":
        return {
          label: t("Automation Active"),
          description: t("Auto-voting active"),
          variant: "positive",
          icon: IoCheckmarkCircle,
        }
      case "pending":
        return {
          label: t("Automation Pending"),
          description: t("Starting next round"),
          variant: "warning",
          icon: FaClock,
        }
      case "manual":
        return {
          label: t("No Automation"),
          description: t("Manual voting"),
          variant: "neutral",
          icon: MdHowToVote,
        }
    }
  }, [status, t])

  if (!account?.address) return null

  return (
    <Skeleton loading={isLoading}>
      <HStack gap={2}>
        <Text color="text.subtle" textStyle={["lg", "lg", "md"]}>
          {t("Automation") + ":"}
        </Text>
        <ChakraBadge variant={config.variant as any} fontWeight="semibold">
          <Icon as={config.icon} boxSize={4} />
          {config.description}
        </ChakraBadge>
      </HStack>
    </Skeleton>
  )
}
