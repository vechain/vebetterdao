import { Badge as ChakraBadge, HStack, Icon, Skeleton, Text } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaClock } from "react-icons/fa6"
import { IoCheckmarkCircle } from "react-icons/io5"
import { MdHowToVote } from "react-icons/md"

import { useIsAutoVotingEnabled } from "../../api/contracts/xAllocations/hooks/useIsAutoVotingEnabled"
import { useIsAutoVotingEnabledInCurrentRound } from "../../api/contracts/xAllocations/hooks/useIsAutoVotingEnabledInCurrentRound"

type AutomationStatus = "active" | "pending" | "manual"

export const AutomationStatusBadge = () => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { data: isAutoVotingEnabled, isLoading: isAutoVotingEnabledLoading } = useIsAutoVotingEnabled(account?.address)
  const { data: isAutoVotingEnabledInCurrentRound, isLoading: isAutoVotingEnabledInCurrentRoundLoading } =
    useIsAutoVotingEnabledInCurrentRound(account?.address)

  const status: AutomationStatus = useMemo(() => {
    if (isAutoVotingEnabledInCurrentRound) return "active"
    if (isAutoVotingEnabled && !isAutoVotingEnabledInCurrentRound) return "pending"
    return "manual"
  }, [isAutoVotingEnabled, isAutoVotingEnabledInCurrentRound])

  const isLoading = isAutoVotingEnabledLoading || isAutoVotingEnabledInCurrentRoundLoading

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
