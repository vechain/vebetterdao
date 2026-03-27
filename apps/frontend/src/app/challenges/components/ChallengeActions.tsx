"use client"

import { Button, HStack, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { parseEther } from "ethers"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ChallengeKind, ChallengeView } from "@/api/challenges/types"
import { useChallengeActions } from "@/api/challenges/useChallengeActions"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"

export const ChallengeActions = ({ challenge }: { challenge: ChallengeView }) => {
  const { account } = useWallet()
  const actions = useChallengeActions()
  const { t } = useTranslation()
  const { data: b3trBalance } = useGetB3trBalance(account?.address ?? undefined)

  const joinStakeAmount = useMemo(() => {
    if (challenge.kind !== ChallengeKind.Stake) return 0n

    try {
      return parseEther(challenge.stakeAmount)
    } catch {
      return 0n
    }
  }, [challenge.kind, challenge.stakeAmount])

  const hasInsufficientB3trForJoin =
    !!account?.address &&
    !!b3trBalance &&
    (challenge.canAccept || challenge.canJoin) &&
    joinStakeAmount > 0n &&
    BigInt(b3trBalance.original) < joinStakeAmount

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
    <VStack align="start" gap="1">
      <HStack flexWrap="wrap" gap="2">
        {challenge.canAccept && (
          <Button
            size="sm"
            variant="primary"
            disabled={hasInsufficientB3trForJoin}
            onClick={() => actions.acceptChallenge(challenge)}>
            {t("Accept")}
          </Button>
        )}
        {challenge.canDecline && (
          <Button size="sm" variant="secondary" onClick={() => actions.declineChallenge(id)}>
            {t("Decline")}
          </Button>
        )}
        {challenge.canJoin && (
          <Button
            size="sm"
            variant="primary"
            disabled={hasInsufficientB3trForJoin}
            onClick={() => actions.joinChallenge(challenge)}>
            {t("Join")}
          </Button>
        )}
        {challenge.canLeave && (
          <Button size="sm" variant="secondary" onClick={() => actions.leaveChallenge(id)}>
            {t("Leave")}
          </Button>
        )}
        {challenge.canCancel && (
          <Button size="sm" variant="secondary" onClick={() => actions.cancelChallenge(id)}>
            {t("Cancel")}
          </Button>
        )}
        {challenge.canClaim && (
          <Button size="sm" variant="primary" onClick={() => actions.claimChallenge(id)}>
            {t("Claim payout")}
          </Button>
        )}
        {challenge.canRefund && (
          <Button size="sm" variant="primary" onClick={() => actions.refundChallenge(id)}>
            {t("Claim refund")}
          </Button>
        )}
        {challenge.canFinalize && (
          <Button size="sm" variant="primary" onClick={() => actions.finalizeChallenge(id)}>
            {t("Finalize")}
          </Button>
        )}
      </HStack>
      {hasInsufficientB3trForJoin && (
        <Text textStyle="xs" color="status.warning.strong">
          {t("Not enough B3TR")}
        </Text>
      )}
    </VStack>
  )
}
