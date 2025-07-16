import { Icon, Badge, HStack, Text } from "@chakra-ui/react"
import { UilBan, UilCheck, UilCodeBranch, UilHeart, UilThumbsUp } from "@iconscout/react-unicons"
import { ProposalState } from "@/api"

type Props = {
  state: ProposalState // Remove undefined since we have a default value
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
  [ProposalState.Succeeded]: {
    text: "Approved",
    icon: UilCheck,
    variant: "approved",
  },
  [ProposalState.Active]: {
    text: "Approval phase",
    icon: UilThumbsUp,
    variant: "approval-phase",
  },
  [ProposalState.Defeated]: {
    text: "Declined",
    icon: UilBan,
    variant: "declined",
  },
  [ProposalState.Executed]: {
    text: "Completed",
    icon: UilCheck,
    variant: "completed",
  },
  [ProposalState.Canceled]: {
    text: "Declined",
    icon: UilBan,
    variant: "declined",
  },
  [ProposalState.DepositNotMet]: {
    text: "Declined",
    icon: UilBan,
    variant: "declined",
  },
  [ProposalState.Queued]: {
    text: "In development",
    icon: UilCodeBranch,
    variant: "support-phase",
  },
}

export const GrantsProposalStatusBadge = ({ state = ProposalState.Pending }: Props) => {
  const config = BADGE_CONFIG[state]

  return (
    <Badge variant={config.variant as any}>
      <HStack textAlign="center" justifyContent="center" alignItems="center">
        <Icon as={config.icon} boxSize={4} />
        <Text> {config.text}</Text>
      </HStack>
    </Badge>
  )
}
