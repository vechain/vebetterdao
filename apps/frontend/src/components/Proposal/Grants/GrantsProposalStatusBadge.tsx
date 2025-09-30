import HeartSolidIcon from "@/components/Icons/svg/heart-solid.svg"
import HeartIcon from "@/components/Icons/svg/heart.svg"
import ThumbsUpSolidIcon from "@/components/Icons/svg/thumbs-up-solid.svg"
import ThumbsUpIcon from "@/components/Icons/svg/thumbs-up.svg"
import { ProposalState, ProposalType } from "@/hooks/proposals/grants/types"
import { Badge, BadgeProps, HStack, Icon, Text } from "@chakra-ui/react"
import { Prohibition } from "iconoir-react"
import { useMemo } from "react"
import { FaRegCircleCheck } from "react-icons/fa6"
import { IoIosCode } from "react-icons/io"

type Props = {
  state: ProposalState
  depositReached: boolean
  hasUserSupported?: boolean
  hasUserVoted?: boolean
  proposalType?: ProposalType
}

/**
 * Extract the variant type from Chakra UI's Badge component props
 * This ensures type safety with the theme's badge variants
 */
type BadgeVariant = NonNullable<BadgeProps["variant"]>
type BadgeConfig = {
  text: string
  variant: BadgeVariant
  icon: React.ElementType
  filledIcon?: React.ElementType
}

// Define the badge configuration for each proposal state
const BADGE_CONFIG: { [key in ProposalState]: BadgeConfig } = {
  [ProposalState.Pending]: {
    text: "Support phase",
    icon: HeartIcon,
    filledIcon: HeartSolidIcon,
    variant: "support-phase",
  },
  [ProposalState.Active]: {
    text: "Approval phase",
    icon: ThumbsUpIcon,
    filledIcon: ThumbsUpSolidIcon,
    variant: "approval-phase",
  },
  [ProposalState.Canceled]: {
    text: "Cancelled",
    icon: Prohibition,
    variant: "declined",
  },
  [ProposalState.Defeated]: {
    text: "Cancelled",
    icon: Prohibition,
    variant: "declined",
  },
  [ProposalState.Succeeded]: {
    text: "Approved",
    icon: ThumbsUpSolidIcon,
    variant: "approved",
  },
  [ProposalState.Queued]: {
    text: "Queued",
    icon: IoIosCode,
    variant: "in-development",
  },

  [ProposalState.Executed]: {
    text: "Executed",
    icon: FaRegCircleCheck,
    variant: "completed",
  },

  [ProposalState.DepositNotMet]: {
    text: "Declined",
    icon: Prohibition,
    variant: "declined",
  },

  [ProposalState.InDevelopment]: {
    text: "In development",
    icon: IoIosCode,
    variant: "in-development",
  },

  [ProposalState.Completed]: {
    text: "Completed",
    icon: FaRegCircleCheck,
    variant: "completed",
  },
}

/**
 * Grants proposal status badge component that shows proposal state with appropriate styling
 * Uses Chakra UI theme badge variants for consistent styling across the app
 *
 * @param state - The current proposal state
 * @param hasUserSupported - Whether the user has supported the proposal (for support phase)
 * @param hasUserVoted - Whether the user has voted on the proposal (for approval phase)
 * @param depositReached - Whether the deposit has been reached
 */
export const GrantsProposalStatusBadge = ({
  state = ProposalState.Pending,
  hasUserSupported,
  hasUserVoted,
  depositReached,
}: Props) => {
  const config = BADGE_CONFIG[state]

  const selectedIcon = useMemo(() => {
    // Show filled icon if user has interacted in the current phase
    if (state === ProposalState.Pending && hasUserSupported) {
      return config.filledIcon || config.icon
    } else if (state === ProposalState.Active && hasUserVoted) {
      return config.filledIcon || config.icon
    }

    return config.icon
  }, [state, hasUserSupported, hasUserVoted, config])

  const text = useMemo(() => {
    if (state === ProposalState.Pending && depositReached) {
      return "Supported"
    }
    return config.text
  }, [state, config, depositReached])

  const variant = useMemo(() => {
    if (state === ProposalState.Pending && depositReached) {
      return "approved"
    }
    return config.variant
  }, [state, config, depositReached])

  return (
    <Badge variant={variant}>
      <HStack textAlign="center" justifyContent="center" alignItems="center">
        <Icon as={selectedIcon} boxSize={4} />
        <Text fontWeight="semibold"> {text}</Text>
      </HStack>
    </Badge>
  )
}
