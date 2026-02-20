import { Icon, Badge, BadgeProps, Skeleton } from "@chakra-ui/react"
import { TFunction } from "i18next"
import { Prohibition } from "iconoir-react"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { IoIosCode } from "react-icons/io"

import HeartIcon from "@/components/Icons/svg/heart.svg"
import ThumbsUpSolidIcon from "@/components/Icons/svg/thumbs-up-solid.svg"
import ThumbsUpIcon from "@/components/Icons/svg/thumbs-up.svg"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { useIsDepositReached } from "../../api/contracts/governance/hooks/useIsDepositReached"

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
        icon: <Icon as={ThumbsUpSolidIcon} boxSize={4} />,
        variant: "positive",
      }
    case ProposalState.Canceled:
      return {
        text: t("Canceled"),
        icon: <Icon as={Prohibition} boxSize={4} />,
        variant: "negative",
      }
    case ProposalState.DepositNotMet:
      return {
        text: t("Support not reached"),
        icon: <Icon as={Prohibition} boxSize={4} />,
        variant: "negative",
      }
    case ProposalState.Pending:
      if (isDepositReached) {
        return {
          text: t("Support reached"),
          icon: <Icon as={HeartIcon} boxSize={4} />,
          variant: "positive",
        }
      }
      return {
        text: t("Looking for support"),
        icon: <Icon as={HeartIcon} boxSize={4} />,
        variant: "warning",
      }
    case ProposalState.Active:
      return {
        text: t("Active now"),
        icon: <Icon as={ThumbsUpIcon} boxSize={4} />,
        variant: "info",
      }
    case ProposalState.Defeated:
      return {
        text: t("Ended and rejected"),
        icon: <Icon as={Prohibition} boxSize={4} />,
        variant: "negative",
      }
    case ProposalState.Queued:
      return {
        text: t("Ended and queued"),
        icon: <Icon as={IoIosCode} boxSize={4} />,
        variant: "positive",
      }
    case ProposalState.Executed:
      return {
        text: t("Ended and executed"),
        icon: <Icon as={IoIosCode} boxSize={4} />,
        variant: "positive",
      }
    // This is shown in homepage, so even if it's in dev or completed,
    // we show "approved" because it was voted in that round and it was approved
    case ProposalState.InDevelopment:
      return {
        text: t("Approved"),
        icon: <Icon as={ThumbsUpSolidIcon} boxSize={4} />,
        variant: "positive",
      }
    case ProposalState.Completed:
      return {
        text: t("Approved"),
        icon: <Icon as={ThumbsUpSolidIcon} boxSize={4} />,
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
