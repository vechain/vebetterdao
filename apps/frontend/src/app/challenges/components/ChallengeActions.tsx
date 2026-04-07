"use client"

import { Button, HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { parseEther } from "ethers"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ChallengeKind, ChallengeView, ParticipantStatus } from "@/api/challenges/types"
import { useChallengeActions } from "@/api/challenges/useChallengeActions"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"

type ChallengeActionsLayout = "default" | "card"

export const hasChallengeActions = (challenge: ChallengeView) =>
  challenge.canAccept ||
  challenge.canDecline ||
  challenge.canJoin ||
  challenge.canLeave ||
  challenge.canCancel ||
  challenge.canClaim ||
  challenge.canRefund ||
  challenge.canFinalize

export const ChallengeActions = ({
  challenge,
  layout = "default",
  buttonSize,
}: {
  challenge: ChallengeView
  layout?: ChallengeActionsLayout
  buttonSize?: "sm" | "md"
}) => {
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
  const isReacceptingInvite = challenge.canAccept && challenge.viewerStatus === ParticipantStatus.Declined
  const isCardLayout = layout === "card"
  const resolvedButtonSize = buttonSize ?? (isCardLayout ? "md" : "sm")
  const cardButtonProps = isCardLayout ? { w: "full", minH: "11" } : {}
  const actionCount = [
    challenge.canAccept,
    challenge.canDecline,
    challenge.canJoin,
    challenge.canLeave,
    challenge.canCancel,
    challenge.canClaim,
    challenge.canRefund,
    challenge.canFinalize,
  ].filter(Boolean).length

  if (!hasChallengeActions(challenge)) {
    return null
  }

  const id = challenge.challengeId
  const actionButtons = (
    <>
      {challenge.canAccept && (
        <Button
          size={resolvedButtonSize}
          variant="primary"
          disabled={hasInsufficientB3trForJoin}
          onClick={() => actions.acceptChallenge(challenge)}
          {...cardButtonProps}>
          {t("Accept")}
        </Button>
      )}
      {challenge.canDecline && (
        <Button
          size={resolvedButtonSize}
          variant="negative"
          onClick={() => actions.declineChallenge(id)}
          {...cardButtonProps}>
          {t("Decline")}
        </Button>
      )}
      {challenge.canJoin && (
        <Button
          size={resolvedButtonSize}
          variant="primary"
          disabled={hasInsufficientB3trForJoin}
          onClick={() => actions.joinChallenge(challenge)}
          {...cardButtonProps}>
          {t("Join")}
        </Button>
      )}
      {challenge.canLeave && (
        <Button
          size={resolvedButtonSize}
          variant="negative"
          onClick={() => actions.leaveChallenge(id)}
          {...cardButtonProps}>
          {t("Leave")}
        </Button>
      )}
      {challenge.canCancel && (
        <Button
          size={resolvedButtonSize}
          variant="negative"
          onClick={() => actions.cancelChallenge(id)}
          {...cardButtonProps}>
          {t("Cancel")}
        </Button>
      )}
      {challenge.canClaim && (
        <Button
          size={resolvedButtonSize}
          variant="primary"
          onClick={() => actions.claimChallenge(id)}
          {...cardButtonProps}>
          {t("Claim payout")}
        </Button>
      )}
      {challenge.canRefund && (
        <Button
          size={resolvedButtonSize}
          variant="primary"
          onClick={() => actions.refundChallenge(id)}
          {...cardButtonProps}>
          {t("Claim refund")}
        </Button>
      )}
      {challenge.canFinalize && (
        <Button
          size={resolvedButtonSize}
          variant="primary"
          onClick={() => actions.finalizeChallenge(id)}
          {...cardButtonProps}>
          {t("Finalize")}
        </Button>
      )}
    </>
  )

  return (
    <VStack align={isCardLayout ? "stretch" : "start"} gap={isCardLayout ? "3" : "1"}>
      {isReacceptingInvite && (
        <VStack align="start" gap="1">
          <Text textStyle="sm" color="status.negative.strong" fontWeight="semibold">
            {t("Declined")}
          </Text>
          <Text textStyle="sm" color="text.subtle">
            {t("Changed your mind? There is still time to accept.")}
          </Text>
        </VStack>
      )}
      {isCardLayout ? (
        <SimpleGrid columns={actionCount > 1 ? 2 : 1} gap="3" w="full">
          {actionButtons}
        </SimpleGrid>
      ) : (
        <HStack flexWrap="wrap" gap="2">
          {actionButtons}
        </HStack>
      )}
      {hasInsufficientB3trForJoin && (
        <Text textStyle="xs" color="status.warning.strong">
          {t("Not enough B3TR")}
        </Text>
      )}
    </VStack>
  )
}
