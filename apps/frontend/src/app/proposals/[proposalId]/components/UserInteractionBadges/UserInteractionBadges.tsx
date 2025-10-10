import { Box, HStack, Icon, Text } from "@chakra-ui/react"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { ethers } from "ethers"
import { useTranslation } from "react-i18next"

import AbstainIcon from "@/components/Icons/svg/abstain.svg"
import HeartIconFilled from "@/components/Icons/svg/heart-solid.svg"
import ThumbsDownIconFilled from "@/components/Icons/svg/thumbs-down-solid.svg"
import ThumbsUpIconFilled from "@/components/Icons/svg/thumbs-up-solid.svg"
import { VoteType } from "@/types/voting"

export interface UserInteractionBadgesProps {
  userDeposits?: bigint
  userVoteOption?: VoteType
}
type InteractionType = "voted" | "supported" | null
type BadgeConfig = {
  label: string
  color: string
  icon: React.ElementType
  text: string
}
// Define badge configurations for each interaction type
const VOTE_CONFIG: Record<VoteType, Omit<BadgeConfig, "label" | "text"> & { translationKey: string }> = {
  [VoteType.VOTE_FOR]: {
    color: "status.positive.primary",
    icon: ThumbsUpIconFilled,
    translationKey: "Approve",
  },
  [VoteType.VOTE_AGAINST]: {
    color: "status.negative.primary",
    icon: ThumbsDownIconFilled,
    translationKey: "Against",
  },
  [VoteType.ABSTAIN]: {
    color: "status.warning.primary",
    icon: AbstainIcon,
    translationKey: "Abstain",
  },
}
export const UserInteractionBadges = ({ userDeposits, userVoteOption }: UserInteractionBadgesProps) => {
  const { t } = useTranslation()
  // Determine interaction type (priority: voted > supported > none)
  const interactionType: InteractionType = userVoteOption ? "voted" : userDeposits ? "supported" : null
  // Get badge configuration based on interaction type
  const getBadgeConfig = (): BadgeConfig | null => {
    if (interactionType === "voted" && userVoteOption) {
      const config = VOTE_CONFIG[userVoteOption]
      return {
        label: t("You voted"),
        color: config.color,
        icon: config.icon,
        text: t(config.translationKey as any),
      }
    }

    if (interactionType === "supported" && userDeposits) {
      return {
        label: t("You supported with"),
        color: "status.positive.primary",
        icon: HeartIconFilled,
        text: humanNumber(ethers.formatEther(userDeposits), ethers.formatEther(userDeposits), "VOT3"),
      }
    }

    return null
  }

  const config = getBadgeConfig()

  if (!config) return null

  return (
    <HStack>
      <Text color="text.subtle">{config.label}</Text>
      <Box border="2px solid" borderColor={config.color} color={config.color} borderRadius="lg">
        <HStack gap={2} px="12px" py="8px">
          <Icon as={config.icon} boxSize={5} />
          <Text color={config.color}>{config.text}</Text>
        </HStack>
      </Box>
    </HStack>
  )
}
