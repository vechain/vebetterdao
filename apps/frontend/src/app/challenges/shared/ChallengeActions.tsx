import { Button, HStack, Icon, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { parseEther } from "ethers"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuTrophy } from "react-icons/lu"

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
  challenge.canComplete ||
  challenge.canClaimSplitWin ||
  challenge.canClaimCreatorSplitWinRefund

export const ChallengeActions = ({
  challenge,
  layout = "default",
  buttonSize,
  onClaimClick,
  onAcceptClick,
  onDeclineClick,
  onCancelClick,
  onRefundClick,
  onJoinClick,
  onLeaveClick,
  onCompleteClick,
  onClaimSplitWinClick,
  onClaimCreatorSplitWinRefundClick,
}: {
  challenge: ChallengeView
  layout?: ChallengeActionsLayout
  buttonSize?: "sm" | "md"
  onClaimClick?: () => void
  onAcceptClick?: () => void
  onDeclineClick?: () => void
  onCancelClick?: () => void
  onRefundClick?: () => void
  onJoinClick?: () => void
  onLeaveClick?: () => void
  onCompleteClick?: () => void
  onClaimSplitWinClick?: () => void
  onClaimCreatorSplitWinRefundClick?: () => void
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
  const cardButtonProps = isCardLayout ? { w: "full" } : {}
  const actionCount = [
    challenge.canAccept,
    challenge.canDecline,
    challenge.canJoin,
    challenge.canLeave,
    challenge.canCancel,
    challenge.canClaim,
    challenge.canRefund,
    challenge.canComplete,
    challenge.canClaimSplitWin,
    challenge.canClaimCreatorSplitWinRefund,
  ].filter(Boolean).length

  if (!hasChallengeActions(challenge)) {
    return null
  }

  const id = challenge.challengeId
  const handleAccept = onAcceptClick ?? (() => actions.acceptChallenge(challenge))
  const handleDecline = onDeclineClick ?? (() => actions.declineChallenge(id))
  const handleCancel = onCancelClick ?? (() => actions.cancelChallenge(id))
  const handleRefund = onRefundClick ?? (() => actions.refundChallenge(id))
  const handleJoin = onJoinClick ?? (() => actions.joinChallenge(challenge))
  const handleLeave = onLeaveClick ?? (() => actions.leaveChallenge(challenge))
  const handleComplete = onCompleteClick ?? (() => actions.completeChallenge(id))
  const handleClaimSplitWin = onClaimSplitWinClick ?? (() => actions.claimSplitWinPrize(id))
  const handleClaimCreatorSplitWinRefund =
    onClaimCreatorSplitWinRefundClick ?? (() => actions.claimCreatorSplitWinRefund(id))

  const actionButtons = (
    <>
      {challenge.canAccept && (
        <Button
          size={resolvedButtonSize}
          variant="primary"
          disabled={hasInsufficientB3trForJoin}
          onClick={handleAccept}
          {...cardButtonProps}>
          {t("Accept")}
        </Button>
      )}
      {challenge.canDecline && (
        <Button size={resolvedButtonSize} variant="negative" onClick={handleDecline} {...cardButtonProps}>
          {t("Decline")}
        </Button>
      )}
      {challenge.canJoin && (
        <Button
          size={resolvedButtonSize}
          variant="primary"
          disabled={hasInsufficientB3trForJoin}
          onClick={handleJoin}
          {...cardButtonProps}>
          {t("Join")}
        </Button>
      )}
      {challenge.canLeave && (
        <Button size={resolvedButtonSize} variant="negative" onClick={handleLeave} {...cardButtonProps}>
          {t("Leave")}
        </Button>
      )}
      {challenge.canCancel && (
        <Button size={resolvedButtonSize} variant="negative" onClick={handleCancel} {...cardButtonProps}>
          {t("Cancel")}
        </Button>
      )}
      {challenge.canClaim && (
        <Button
          size={resolvedButtonSize}
          variant="primary"
          onClick={() => (onClaimClick ? onClaimClick() : actions.claimChallenge(id))}
          gap="2"
          bg="status.yellow.primary"
          color="yellow.900"
          borderWidth="1px"
          borderColor="status.yellow.secondary"
          boxShadow="sm"
          transition="all 0.2s ease"
          _hover={{
            bg: "yellow.400",
            borderColor: "yellow.500",
            boxShadow: "md",
            transform: "translateY(-1px)",
          }}
          _active={{
            bg: "status.yellow.primary",
            transform: "translateY(0)",
          }}
          _disabled={{
            bg: "actions.disabled.disabled",
            color: "actions.disabled.text",
            borderColor: "transparent",
            boxShadow: "none",
            transform: "none",
          }}
          {...cardButtonProps}>
          <Icon as={LuTrophy} boxSize="4" />
          {t("Claim prize")}
        </Button>
      )}
      {challenge.canClaimSplitWin && (
        <Button
          size={resolvedButtonSize}
          variant="primary"
          onClick={handleClaimSplitWin}
          gap="2"
          bg="status.yellow.primary"
          color="yellow.900"
          borderWidth="1px"
          borderColor="status.yellow.secondary"
          boxShadow="sm"
          transition="all 0.2s ease"
          _hover={{
            bg: "yellow.400",
            borderColor: "yellow.500",
            boxShadow: "md",
            transform: "translateY(-1px)",
          }}
          _active={{
            bg: "status.yellow.primary",
            transform: "translateY(0)",
          }}
          _disabled={{
            bg: "actions.disabled.disabled",
            color: "actions.disabled.text",
            borderColor: "transparent",
            boxShadow: "none",
            transform: "none",
          }}
          {...cardButtonProps}>
          <Icon as={LuTrophy} boxSize="4" />
          {t("Claim prize")}
        </Button>
      )}
      {challenge.canRefund && (
        <Button size={resolvedButtonSize} variant="primary" onClick={handleRefund} {...cardButtonProps}>
          {t("Claim refund")}
        </Button>
      )}
      {challenge.canClaimCreatorSplitWinRefund && (
        <Button
          size={resolvedButtonSize}
          variant="primary"
          onClick={handleClaimCreatorSplitWinRefund}
          {...cardButtonProps}>
          {t("Refund unclaimed slots")}
        </Button>
      )}
      {challenge.canComplete && (
        <Button size={resolvedButtonSize} variant="primary" onClick={handleComplete} {...cardButtonProps}>
          {t("Complete")}
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
