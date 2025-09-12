import { ProposalState, useIsDepositReached } from "@/api"
import { Icon, Badge, BadgeProps, Skeleton } from "@chakra-ui/react"
import { UilBan, UilCheck, UilClockEight, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { FaRegHeart } from "react-icons/fa6"
import { DotSymbol } from "@/components"
import { TFunction } from "i18next"

type Props = {
  proposalId: string
  renderIcon?: boolean
  renderBadge?: boolean
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
}) => {
  switch (proposalState) {
    case ProposalState.Succeeded:
      return {
        text: t("Approved"),
        icon: <Icon as={UilCheck} boxSize={4} color={"secondary.strong"} />,
        color: "brand.secondary",
        bgColor: "status.positive.subtle",
      }
    case ProposalState.Canceled:
      return {
        text: t("Canceled"),
        icon: <Icon as={UilBan} boxSize={4} color={"status.negative.primary"} />,
        color: "status.negative.primary",
        bgColor: "status.negative.subtle",
      }
    case ProposalState.DepositNotMet:
      return {
        text: t("Support not reached"),
        icon: <Icon as={FaRegHeart} boxSize={4} color={"status.negative.primary"} />,
        color: "status.negative.primary",
        bgColor: "status.negative.subtle",
      }
    case ProposalState.Pending:
      if (isDepositReached) {
        return {
          text: t("Upcoming voting"),
          icon: <Icon as={UilClockEight} boxSize={4} color={"brand.primary"} />,
          color: "brand.primary",
          bgColor: "status.positive.subtle",
        }
      }
      return {
        text: t("Looking for support"),
        icon: <Icon as={FaRegHeart} boxSize={4} color={"status.warning.primary"} />,
        color: "status.warning.primary",
        bgColor: "status.warning.subtle",
      }
    case ProposalState.Active:
      return {
        text: t("Active now"),
        icon: <DotSymbol pulse size={2} color="brand.secondary-subtle" />,
        color: "brand.secondary-subtle",
        bgColor: "brand.secondary-strong",
      }
    case ProposalState.Defeated:
      return {
        text: t("Ended and rejected"),
        icon: <Icon as={UilThumbsDown} boxSize={4} color={"status.negative.primary"} />,
        color: "status.negative.primary",
        bgColor: "#F8F8F8",
      }
    case ProposalState.Queued:
      return {
        text: t("Ended and queued"),
        icon: <Icon as={UilThumbsUp} boxSize={4} color={"brand.primary"} />,
        color: "brand.primary",
        bgColor: "status.positive.subtle",
      }
    case ProposalState.Executed:
      return {
        text: t("Ended and executed"),
        icon: <Icon as={UilCheck} boxSize={4} color={"secondary.strong"} />,
        color: "secondary.strong",
        bgColor: "status.positive.subtle",
      }
    default:
      return {
        text: undefined,
        icon: undefined,
        color: undefined,
      }
  }
}

export const ProposalStatusBadge = ({
  proposalId,
  renderIcon = true,
  renderBadge = true,
  proposalState,
  badgeProps,
}: Props) => {
  const { data: isDepositReached, isLoading: isDepositReachedLoading } = useIsDepositReached(proposalId)
  const { t } = useTranslation()

  const { text, color, bgColor, icon } = getProposalBadgeDetails({ t, proposalState, isDepositReached })

  if (!text || !icon) return null

  return (
    <Skeleton loading={!!isDepositReachedLoading}>
      <Badge
        variant={renderBadge ? "solid" : "plain"}
        rounded="full"
        p={renderBadge ? "4px 8px" : "0"}
        color={color}
        bg={renderBadge ? bgColor : "transparent"}
        {...badgeProps}>
        {renderIcon && icon}
        {text}
      </Badge>
    </Skeleton>
  )
}
