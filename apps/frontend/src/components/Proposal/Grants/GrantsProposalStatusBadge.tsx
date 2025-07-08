import { Icon } from "@chakra-ui/react"
import { UilBan, UilCheck, UilCodeBranch, UilHeart, UilThumbsUp } from "@iconscout/react-unicons"
import { Badge } from "@/components"
import { ProposalState } from "@/api"
import { useTranslation } from "react-i18next"

type Props = {
  state?: number | undefined
}

type BadgeConfig = {
  text: string
  textColor: string
  bgColor: string
  icon: React.ElementType
  iconColor: string
}

// Define reusable color themes
// Maybe this code be in the theme file
// TODO: Move to theme file
const colorThemes = {
  support: {
    textColor: "#AF5F00",
    bgColor: "#FFF3E5",
    iconColor: "#AF5F00",
  },
  success: {
    textColor: "#6DCB09",
    bgColor: "#E9FDF1",
    iconColor: "#6DCB09",
  },
  declined: {
    textColor: "#D23F63",
    bgColor: "#FCEEF1",
    iconColor: "#D23F63",
  },
  inDev: {
    textColor: "#0091FF",
    bgColor: "#E6F4FF",
    iconColor: "#0091FF",
  },
  completed: {
    textColor: "#4A5568",
    bgColor: "#EDF2F7",
    iconColor: "#4A5568",
  },
}

// Define the badge configuration for each proposal state
const BADGE_CONFIG: { [key in ProposalState]: BadgeConfig } = {
  [ProposalState.Pending]: {
    text: "Support phase",
    icon: UilHeart,
    ...colorThemes.support,
  },
  [ProposalState.Succeeded]: {
    text: "Supported",
    icon: UilHeart,
    ...colorThemes.success,
  },
  [ProposalState.Active]: {
    text: "Approval phase",
    icon: UilThumbsUp,
    ...colorThemes.support,
  },
  [ProposalState.Defeated]: {
    text: "Declined",
    icon: UilBan,
    ...colorThemes.declined,
  },
  [ProposalState.Queued]: {
    text: "In development",
    icon: UilCodeBranch,
    ...colorThemes.inDev,
  },
  [ProposalState.Executed]: {
    text: "Completed",
    icon: UilCheck,
    ...colorThemes.completed,
  },
  [ProposalState.Canceled]: {
    text: "Cancelled",
    icon: UilBan,
    ...colorThemes.declined,
  },
  [ProposalState.DepositNotMet]: {
    text: "Declined",
    icon: UilBan,
    ...colorThemes.declined,
  },
}

export const GrantsProposalStatusBadge = ({ state }: Props) => {
  const { t } = useTranslation()
  const proposalState = state ?? ProposalState.Pending

  const config = BADGE_CONFIG[proposalState as ProposalState]

  return (
    <Badge
      text={t(config.text as any)} //TODO: Improve this instead of any
      textProps={{
        color: config.textColor,
      }}
      containerProps={{
        bgColor: config.bgColor,
        px: 2,
        py: 1,
      }}
      icon={<Icon as={config.icon} boxSize={4} color={config.iconColor} />}
    />
  )
}
