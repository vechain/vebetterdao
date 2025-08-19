import { Icon, Badge, HStack, Text } from "@chakra-ui/react"
import { UilBan, UilCheck, UilCodeBranch, UilHeart, UilThumbsUp } from "@iconscout/react-unicons"
import { ProposalState } from "@/hooks/proposals/grants/types"

type Props = {
  state: ProposalState
}

type BadgeConfig = {
  text: string
  variant: "support-phase" | "approval-phase" | "declined" | "completed" | "approved"
  icon: React.ElementType
}

// Define the badge configuration for each proposal state
const BADGE_CONFIG: { [key in ProposalState]: BadgeConfig } = {
  [ProposalState.Pending]: {
    text: "Support phase",
    icon: UilHeart,
    variant: "support-phase",
  },
  [ProposalState.Active]: {
    text: "Approval phase",
    icon: UilThumbsUp,
    variant: "approval-phase",
  },
  [ProposalState.Canceled]: {
    text: "Declined",
    icon: UilBan,
    variant: "declined",
  },
  [ProposalState.Defeated]: {
    text: "Declined",
    icon: UilBan,
    variant: "declined",
  },
  [ProposalState.Succeeded]: {
    text: "Approved",
    icon: UilCheck,
    variant: "approved",
  },
  [ProposalState.Queued]: {
    text: "In development",
    icon: UilCodeBranch,
    variant: "support-phase",
  },

  [ProposalState.Executed]: {
    text: "Executed",
    icon: UilCheck,
    variant: "completed",
  },

  [ProposalState.DepositNotMet]: {
    text: "Declined",
    icon: UilBan,
    variant: "declined",
  },

  [ProposalState.InDevelopment]: {
    text: "In development",
    icon: UilCodeBranch,
    variant: "support-phase",
  },

  [ProposalState.Completed]: {
    text: "Completed",
    icon: UilCheck,
    variant: "completed",
  },
}

export const GrantsProposalStatusBadge = ({ state = ProposalState.Pending }: Props) => {
  const config = BADGE_CONFIG[state]

  return (
    <Badge variant={config.variant as any}>
      <HStack textAlign="center" justifyContent="center" alignItems="center">
        <Icon as={config.icon} boxSize={5} />
        <Text fontWeight="bold"> {config.text}</Text>
      </HStack>
    </Badge>
  )
}
