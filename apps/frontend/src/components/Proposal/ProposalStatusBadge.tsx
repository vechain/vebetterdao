import { Icon, StackProps, TextProps } from "@chakra-ui/react"
import { UilBan, UilCheck, UilClockEight, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { FaRegHeart } from "react-icons/fa6"
import { Badge, DotSymbol } from "@/components"
import { ProposalState, ProposalType } from "@/hooks/proposals/grants/types"
import { GrantsProposalStatusBadge } from "./Grants/GrantsProposalStatusBadge"

type Props = {
  renderIcon?: boolean
  renderBadge?: boolean
  textProps?: TextProps
  containerProps?: StackProps
  proposalState?: ProposalState
  isDepositReached: boolean
  proposalType?: ProposalType
}

export const ProposalStatusBadge = ({
  renderBadge = true,
  renderIcon = true,
  textProps = {},
  containerProps = {},
  proposalState,
  isDepositReached,
  proposalType,
}: Props) => {
  const { t } = useTranslation()

  if (proposalType === ProposalType.Grant) {
    return <GrantsProposalStatusBadge state={proposalState} /> // TODO: extend the exist to remove GrantsBadge
  }
  switch (proposalState) {
    case ProposalState.Succeeded:
      return (
        <Badge
          textProps={{
            color: "#6DCB09",
            ...textProps,
          }}
          containerProps={
            renderBadge
              ? {
                  bgColor: "#E9FDF1",
                  ...containerProps,
                }
              : {
                  px: 0,
                  py: 0,
                  ...containerProps,
                }
          }
          text={t("Approved")}
          icon={renderIcon ? <Icon as={UilCheck} boxSize={4} color={"#6DCB09"} /> : undefined}
        />
      )

    case ProposalState.Canceled:
      return (
        <Badge
          textProps={{
            color: "#D23F63",
            ...textProps,
          }}
          containerProps={
            renderBadge
              ? {
                  bgColor: "#FCEEF1",
                  ...containerProps,
                }
              : {
                  px: 0,
                  py: 0,
                  ...containerProps,
                }
          }
          text={t("Canceled")}
          icon={renderIcon ? <Icon as={UilBan} boxSize={4} color={"#D23F63"} /> : undefined}
        />
      )
    case ProposalState.DepositNotMet:
      return (
        <Badge
          textProps={{
            color: "#D23F63",
            ...textProps,
          }}
          containerProps={
            renderBadge
              ? {
                  bgColor: "#FCEEF1",
                  ...containerProps,
                }
              : {
                  px: 0,
                  py: 0,
                  ...containerProps,
                }
          }
          text={t("Support not reached")}
          icon={renderIcon ? <Icon as={FaRegHeart} boxSize={4} color={"#D23F63"} /> : undefined}
        />
      )

    case ProposalState.Pending:
      if (isDepositReached)
        return (
          <Badge
            textProps={{
              color: "#004CFC",
              ...textProps,
            }}
            containerProps={
              renderBadge
                ? {
                    bgColor: "#E0E9FE",
                    ...containerProps,
                  }
                : {
                    px: 0,
                    py: 0,
                    ...containerProps,
                  }
            }
            text={t("Upcoming voting")}
            icon={renderIcon ? <Icon as={UilClockEight} boxSize={4} color={"#004CFC"} /> : undefined}
          />
        )

      return (
        <Badge
          textProps={{
            color: "#F29B32",
            ...textProps,
          }}
          containerProps={
            renderBadge
              ? {
                  bgColor: "#FFF3E5",
                  ...containerProps,
                }
              : {
                  px: 0,
                  py: 0,
                  ...containerProps,
                }
          }
          text={t("Looking for support")}
          icon={renderIcon ? <Icon as={FaRegHeart} boxSize={4} color={"#F29B32"} /> : undefined}
        />
      )

    case ProposalState.Active:
      return (
        <Badge
          textProps={{
            color: "#3A6F00",
            ...textProps,
          }}
          containerProps={
            renderBadge
              ? {
                  bgColor: "#CDFF9F",
                  ...containerProps,
                }
              : {
                  px: 0,
                  py: 0,
                  ...containerProps,
                }
          }
          text={t("Active now")}
          icon={renderIcon ? <DotSymbol pulse size={2} color={"#3A6F00"} /> : undefined}
        />
      )

    case ProposalState.Defeated:
      return (
        <Badge
          textProps={{
            color: "#D23F63",
            ...textProps,
          }}
          containerProps={
            renderBadge
              ? {
                  bgColor: "#F8F8F8",
                  ...containerProps,
                }
              : {
                  px: 0,
                  py: 0,
                  ...containerProps,
                }
          }
          text={t("Ended and rejected")}
          icon={renderIcon ? <Icon as={UilThumbsDown} boxSize={4} color={"#D23F63"} /> : undefined}
        />
      )

    case ProposalState.Queued:
      return (
        <Badge
          textProps={{
            color: "#004CFC",
            ...textProps,
          }}
          containerProps={
            renderBadge
              ? {
                  bgColor: "#EBF1FE",
                  ...containerProps,
                }
              : {
                  px: 0,
                  py: 0,
                  ...containerProps,
                }
          }
          text={t("Ended and queued")}
          icon={renderIcon ? <Icon as={UilThumbsUp} boxSize={4} color={"#004CFC"} /> : undefined}
        />
      )

    case ProposalState.Executed:
      return (
        <Badge
          textProps={{
            color: "#6DCB09",
            ...textProps,
          }}
          containerProps={
            renderBadge
              ? {
                  bgColor: "#E9FDF1",
                  ...containerProps,
                }
              : {
                  px: 0,
                  py: 0,
                  ...containerProps,
                }
          }
          text={t("Ended and executed")}
          icon={renderIcon ? <Icon as={UilCheck} boxSize={4} color={"#6DCB09"} /> : undefined}
        />
      )

    default:
      return null
  }
}
