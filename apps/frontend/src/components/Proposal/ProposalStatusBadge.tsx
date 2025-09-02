import { ProposalState, useIsDepositReached } from "@/api"
import { Icon, Skeleton, StackProps, TextProps } from "@chakra-ui/react"
import { UilBan, UilCheck, UilClockEight, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { FaRegHeart } from "react-icons/fa6"
import { Badge, DotSymbol } from "@/components"

type Props = {
  proposalId: string
  renderIcon?: boolean
  textProps?: TextProps
  containerProps?: StackProps
  proposalState?: ProposalState
}

export const ProposalStatusBadge = ({ proposalId, renderIcon = true, textProps = {}, proposalState }: Props) => {
  const { data: isDepositReached, isLoading: isDepositReachedLoading } = useIsDepositReached(proposalId)
  const { t } = useTranslation()

  switch (proposalState) {
    case ProposalState.Succeeded:
      return (
        <Badge
          textProps={{
            color: "secondary.strong",
            ...textProps,
          }}
          text={t("Approved")}
          icon={renderIcon ? <Icon as={UilCheck} boxSize={4} color={"secondary.strong"} /> : undefined}
        />
      )

    case ProposalState.Canceled:
      return (
        <Badge
          textProps={{
            color: "error.primary",
            ...textProps,
          }}
          text={t("Canceled")}
          icon={renderIcon ? <Icon as={UilBan} boxSize={4} color={"error.primary"} /> : undefined}
        />
      )
    case ProposalState.DepositNotMet:
      return (
        <Badge
          textProps={{
            color: "error.primary",
            ...textProps,
          }}
          text={t("Support not reached")}
          icon={renderIcon ? <Icon as={FaRegHeart} boxSize={4} color={"error.primary"} /> : undefined}
        />
      )

    case ProposalState.Pending:
      if (isDepositReached)
        return (
          <Skeleton loading={isDepositReachedLoading}>
            <Badge
              textProps={{
                color: "brand.primary",
                ...textProps,
              }}
              text={t("Upcoming voting")}
              icon={renderIcon ? <Icon as={UilClockEight} boxSize={4} color={"brand.primary"} /> : undefined}
            />
          </Skeleton>
        )

      return (
        <Skeleton loading={isDepositReachedLoading}>
          <Badge
            textProps={{
              color: "warning.primary",
              ...textProps,
            }}
            text={t("Looking for support")}
            icon={renderIcon ? <Icon as={FaRegHeart} boxSize={4} color={"warning.primary"} /> : undefined}
          />
        </Skeleton>
      )

    case ProposalState.Active:
      return (
        <Badge
          textProps={{
            color: "success.strong",
            ...textProps,
          }}
          text={t("Active now")}
          icon={renderIcon ? <DotSymbol pulse size={2} color="success.strong" /> : undefined}
        />
      )

    case ProposalState.Defeated:
      return (
        <Badge
          textProps={{
            color: "error.primary",
            ...textProps,
          }}
          text={t("Ended and rejected")}
          icon={renderIcon ? <Icon as={UilThumbsDown} boxSize={4} color={"error.primary"} /> : undefined}
        />
      )

    case ProposalState.Queued:
      return (
        <Badge
          textProps={{
            color: "brand.primary",
            ...textProps,
          }}
          text={t("Ended and queued")}
          icon={renderIcon ? <Icon as={UilThumbsUp} boxSize={4} color={"brand.primary"} /> : undefined}
        />
      )

    case ProposalState.Executed:
      return (
        <Badge
          textProps={{
            color: "secondary.strong",
            ...textProps,
          }}
          text={t("Ended and executed")}
          icon={renderIcon ? <Icon as={UilCheck} boxSize={4} color={"secondary.strong"} /> : undefined}
        />
      )

    default:
      return null
  }
}
