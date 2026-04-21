import { Alert } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { ChallengeDetail, ChallengeKind, ChallengeStatus } from "@/api/challenges/types"

interface ChallengeRoleBannerProps {
  challenge: ChallengeDetail
}

export const ChallengeRoleBanner = ({ challenge }: ChallengeRoleBannerProps) => {
  const { t } = useTranslation()

  const isParticipant =
    challenge.isJoined && challenge.status !== ChallengeStatus.Cancelled && challenge.status !== ChallengeStatus.Invalid
  const isSponsor = challenge.kind === ChallengeKind.Sponsored && challenge.isCreator

  const isWinner = challenge.canClaim
  if (!isParticipant && !isSponsor && !isWinner) return null

  const { title, description, status } = (() => {
    if (isWinner) {
      return {
        title: t("You won this quest!"),
        description: t("Congratulations! Claim your prize before it's too late."),
        status: "warning" as const,
      }
    }

    if (isSponsor) {
      switch (challenge.status) {
        case ChallengeStatus.Pending:
          return {
            title: t("You are sponsoring this quest"),
            description: t("Your quest is about to begin — participants are gearing up!"),
            status: "info" as const,
          }
        case ChallengeStatus.Active:
          return {
            title: t("You are sponsoring this quest"),
            description: t("The competition is live — watch your participants battle it out."),
            status: "success" as const,
          }
        case ChallengeStatus.Completed:
          return {
            title: t("You sponsored this quest"),
            description: t("The quest is over — thanks for fueling the competition!"),
            status: "info" as const,
          }
        default:
          return {
            title: t("You sponsored this quest"),
            description: null,
            status: "info" as const,
          }
      }
    }

    switch (challenge.status) {
      case ChallengeStatus.Pending:
        return {
          title: t("You joined this quest"),
          description: t("Get ready — the quest starts soon. Prepare your strategy!"),
          status: "info" as const,
        }
      case ChallengeStatus.Active:
        return {
          title: t("You are participating in this quest"),
          description: t("The clock is ticking — don't lose time, every round counts!"),
          status: "success" as const,
        }
      case ChallengeStatus.Completed:
        return {
          title: t("You participated in this quest"),
          description: t("Well played — check the results and see how you did!"),
          status: "info" as const,
        }
      default:
        return {
          title: t("You participated in this quest"),
          description: null,
          status: "info" as const,
        }
    }
  })()

  return (
    <Alert.Root status={status} size="sm" borderRadius="xl">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>
          {isWinner && "🏆 "}
          {title}
        </Alert.Title>
        {description && <Alert.Description>{description}</Alert.Description>}
      </Alert.Content>
    </Alert.Root>
  )
}
