"use client"

import { Button, HStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { ChallengeView } from "@/api/challenges/types"
import { useChallengeActions } from "@/api/challenges/useChallengeActions"

export const ChallengeActions = ({ challenge }: { challenge: ChallengeView }) => {
  const actions = useChallengeActions()
  const { t } = useTranslation()

  if (
    !challenge.canAccept &&
    !challenge.canDecline &&
    !challenge.canJoin &&
    !challenge.canLeave &&
    !challenge.canCancel &&
    !challenge.canClaim &&
    !challenge.canRefund &&
    !challenge.canFinalize
  ) {
    return null
  }

  const id = challenge.challengeId

  return (
    <HStack flexWrap="wrap" gap="2">
      {challenge.canAccept && (
        <Button size="sm" variant="solid" onClick={() => actions.acceptChallenge(challenge)}>
          {t("Accept")}
        </Button>
      )}
      {challenge.canDecline && (
        <Button size="sm" variant="ghost" onClick={() => actions.declineChallenge(id)}>
          {t("Decline")}
        </Button>
      )}
      {challenge.canJoin && (
        <Button size="sm" variant="solid" onClick={() => actions.joinChallenge(challenge)}>
          {t("Join")}
        </Button>
      )}
      {challenge.canLeave && (
        <Button size="sm" variant="ghost" onClick={() => actions.leaveChallenge(id)}>
          {t("Leave")}
        </Button>
      )}
      {challenge.canCancel && (
        <Button size="sm" variant="ghost" onClick={() => actions.cancelChallenge(id)}>
          {t("Cancel")}
        </Button>
      )}
      {challenge.canClaim && (
        <Button size="sm" variant="solid" onClick={() => actions.claimChallenge(id)}>
          {t("Claim payout")}
        </Button>
      )}
      {challenge.canRefund && (
        <Button size="sm" variant="solid" onClick={() => actions.refundChallenge(id)}>
          {t("Claim refund")}
        </Button>
      )}
      {challenge.canFinalize && (
        <Button size="sm" variant="ghost" onClick={() => actions.finalizeChallenge(id)}>
          {t("Finalize")}
        </Button>
      )}
    </HStack>
  )
}
