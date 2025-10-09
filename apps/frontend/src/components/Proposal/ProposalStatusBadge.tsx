import { Icon, Badge, BadgeProps, Skeleton } from "@chakra-ui/react"
import { UilBan, UilCheck, UilClockEight, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { TFunction } from "i18next"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { FaRegHeart } from "react-icons/fa6"

import { ProposalState } from "@/hooks/proposals/grants/types"

import { useIsDepositReached } from "../../api/contracts/governance/hooks/useIsDepositReached"
import { DotSymbol } from "../DotSymbol"

type Props = {
  proposalId: string
  renderIcon?: boolean
  proposalState?: ProposalState
  badgeProps?: BadgeProps
}
const getProposalBadgeDetails = ({
  t,
  proposalState,
  isDepositReached,
}: {
  t: TFunction
  proposalState?: ProposalState
  isDepositReached?: boolean
}): { text: string; icon: ReactNode; variant: BadgeProps["variant"] } => {
  switch (proposalState) {
    case ProposalState.Succeeded:
      return {
        text: t("Approved"),
        icon: <Icon as={UilCheck} boxSize={4} />,
        variant: "positive",
      }
    case ProposalState.Canceled:
      return {
        text: t("Canceled"),
        icon: <Icon as={UilBan} boxSize={4} />,
        variant: "negative",
      }
    case ProposalState.DepositNotMet:
      return {
        text: t("Support not reached"),
        icon: <Icon as={FaRegHeart} boxSize={4} />,
        variant: "negative",
      }
    case ProposalState.Pending:
      if (isDepositReached) {
        return {
          text: t("Upcoming voting"),
          icon: <Icon as={UilClockEight} boxSize={4} />,
          variant: "positive",
        }
      }
      return {
        text: t("Looking for support"),
        icon: <Icon as={FaRegHeart} boxSize={4} />,
        variant: "warning",
      }
    case ProposalState.Active:
      return {
        text: t("Active now"),
        icon: <DotSymbol pulse size={2} color="status.info.strong" />,
        variant: "info",
      }
    case ProposalState.Defeated:
      return {
        text: t("Ended and rejected"),
        icon: <Icon as={UilThumbsDown} boxSize={4} />,
        variant: "negative",
      }
    case ProposalState.Queued:
      return {
        text: t("Ended and queued"),
        icon: <Icon as={UilThumbsUp} boxSize={4} />,
        variant: "positive",
      }
    case ProposalState.Executed:
      return {
        text: t("Ended and executed"),
        icon: <Icon as={UilCheck} boxSize={4} />,
        variant: "positive",
      }
    default:
      return {
        text: "",
        icon: "",
        variant: "neutral",
      }
  }
}

export const ProposalStatusBadge = ({ proposalId, renderIcon = true, proposalState, badgeProps }: Props) => {
  const { data: isDepositReached, isLoading: isDepositReachedLoading } = useIsDepositReached(proposalId)
  const { t } = useTranslation()

  const { text, variant, icon } = getProposalBadgeDetails({ t, proposalState, isDepositReached })

  if (!text || !icon) return null

  return (
    <Skeleton loading={!!isDepositReachedLoading}>
      <Badge variant={variant} rounded="full" {...badgeProps}>
        {renderIcon && icon}
        {text}
      </Badge>
    </Skeleton>
  )
}
