import { Badge, Box, Card, Heading, HStack, Icon, IconButton, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { UilShareAlt } from "@iconscout/react-unicons"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"

import {
  ChallengeDetail,
  ChallengeKind,
  ChallengeStatus,
  challengeStatusLabel,
  ParticipantStatus,
  SettlementMode,
} from "@/api/challenges/types"
import { useChallengeActions } from "@/api/challenges/useChallengeActions"
import { useChallengeStatusTime } from "@/api/challenges/useChallengeStatusTime"

import { ChallengeActions, hasChallengeActions } from "../../shared/ChallengeActions"
import { getChallengeStatusBadgeVariant } from "../../shared/challengeBadgeVariants"
import { ChallengeCreatorChip } from "../../shared/ChallengeCreatorChip"
import { getChallengeInvalidReason } from "../../shared/challengeInvalidReason"
import { ChallengeVisibilityBadge } from "../../shared/ChallengeStatusBadges"
import { useChallengeDescription } from "../../shared/useChallengeDescription"

import { ChallengeAcceptModal } from "./ChallengeAcceptModal"
import { ChallengeCancelModal } from "./ChallengeCancelModal"
import { ChallengeClaimModal } from "./ChallengeClaimModal"
import { ChallengeCompleteModal } from "./ChallengeCompleteModal"
import { ChallengeDeclineModal } from "./ChallengeDeclineModal"
import { ChallengeJoinModal } from "./ChallengeJoinModal"
import { ChallengeLeaveModal } from "./ChallengeLeaveModal"
import { ChallengeRefundModal } from "./ChallengeRefundModal"
import { ChallengeShareModal } from "./ChallengeShareModal"
import { ChallengeSplitWinClaimModal } from "./ChallengeSplitWinClaimModal"
import { ChallengeSplitWinCreatorRefundModal } from "./ChallengeSplitWinCreatorRefundModal"

interface ChallengeHeaderCardProps {
  challenge: ChallengeDetail
}

export const ChallengeHeaderCard = ({ challenge }: ChallengeHeaderCardProps) => {
  const { t } = useTranslation()
  const statusTime = useChallengeStatusTime(challenge)
  const actions = useChallengeActions()
  const { onOpen: onShareOpen, onClose: onShareClose, open: isShareOpen } = useDisclosure()
  const { onOpen: onClaimOpen, onClose: onClaimClose, open: isClaimOpen } = useDisclosure()
  const { onOpen: onAcceptOpen, onClose: onAcceptClose, open: isAcceptOpen } = useDisclosure()
  const { onOpen: onDeclineOpen, onClose: onDeclineClose, open: isDeclineOpen } = useDisclosure()
  const { onOpen: onCancelOpen, onClose: onCancelClose, open: isCancelOpen } = useDisclosure()
  const { onOpen: onRefundOpen, onClose: onRefundClose, open: isRefundOpen } = useDisclosure()
  const { onOpen: onJoinOpen, onClose: onJoinClose, open: isJoinOpen } = useDisclosure()
  const { onOpen: onLeaveOpen, onClose: onLeaveClose, open: isLeaveOpen } = useDisclosure()
  const { onOpen: onCompleteOpen, onClose: onCompleteClose, open: isCompleteOpen } = useDisclosure()
  const { onOpen: onSplitWinClaimOpen, onClose: onSplitWinClaimClose, open: isSplitWinClaimOpen } = useDisclosure()
  const { onOpen: onSplitWinRefundOpen, onClose: onSplitWinRefundClose, open: isSplitWinRefundOpen } = useDisclosure()

  const challengeDescription = useChallengeDescription(challenge)

  const isEnded = challenge.canComplete || challenge.status === ChallengeStatus.Completed
  const statusTimeLabel = (() => {
    if (isEnded) return t("Ended")
    if (!statusTime) return null
    const time = statusTime.fromNow()
    const opts = { time, interpolation: { escapeValue: false } }
    switch (challenge.status) {
      case ChallengeStatus.Pending:
        return t("Starts {{time}}", opts)
      case ChallengeStatus.Active:
        return t("Ends {{time}}", opts)
      default:
        return null
    }
  })()

  const slotsLeft = Math.max(challenge.numWinners - challenge.winnersClaimed, 0)
  const challengeTitle = challenge.title || t("B3MO Quest #{{id}}", { id: challenge.challengeId })
  // Max Actions splits the pool equally across all top scorers tied at bestScore (matches contract _payoutAmount).
  // totalPrize is an ether-formatted decimal string (see buildChallengeView), so divide as Number.
  const claimShare =
    challenge.settlementMode === SettlementMode.TopWinners && challenge.bestCount > 1
      ? (Number(challenge.totalPrize) / challenge.bestCount).toString()
      : challenge.totalPrize
  const claimPrizeLabel = humanNumber(claimShare, claimShare, "B3TR")
  const stakeLabel = humanNumber(challenge.stakeAmount, challenge.stakeAmount, "B3TR")
  const perWinnerLabel = humanNumber(challenge.prizePerWinner, challenge.prizePerWinner, "B3TR")
  const splitWinRefundLabel = humanNumber(
    String(slotsLeft * Number(challenge.prizePerWinner)),
    String(slotsLeft * Number(challenge.prizePerWinner)),
    "B3TR",
  )

  const isReacceptingInvite = challenge.canAccept && challenge.viewerStatus === ParticipantStatus.Declined

  return (
    <>
      <Card.Root variant="primary" p="4" w="full">
        <VStack align="stretch" gap="4">
          <HStack justify="space-between" align="start">
            <HStack gap="1.5">
              <ChallengeVisibilityBadge challenge={challenge} />
              <ChallengeCreatorChip creator={challenge.creator} />
            </HStack>
            <HStack gap="5">
              {isReacceptingInvite && (
                <VStack align="start" gap="1" w="full">
                  <Text textStyle="sm" color="status.negative.strong" fontWeight="semibold">
                    {t("Declined")}
                  </Text>
                  <Text textStyle="sm" color="text.subtle">
                    {t("Changed your mind? There is still time to accept.")}
                  </Text>
                </VStack>
              )}
              <HStack gap="2" flexShrink={0}>
                {hasChallengeActions(challenge) && (
                  <Box display={{ base: "none", md: "block" }}>
                    <ChallengeActions
                      challenge={challenge}
                      buttonSize="sm"
                      onClaimClick={challenge.canClaim ? onClaimOpen : undefined}
                      onAcceptClick={challenge.canAccept ? onAcceptOpen : undefined}
                      onDeclineClick={challenge.canDecline ? onDeclineOpen : undefined}
                      onCancelClick={challenge.canCancel ? onCancelOpen : undefined}
                      onRefundClick={challenge.canRefund ? onRefundOpen : undefined}
                      onJoinClick={challenge.canJoin ? onJoinOpen : undefined}
                      onLeaveClick={challenge.canLeave ? onLeaveOpen : undefined}
                      onCompleteClick={challenge.canComplete ? onCompleteOpen : undefined}
                      onClaimSplitWinClick={challenge.canClaimSplitWin ? onSplitWinClaimOpen : undefined}
                      onClaimCreatorSplitWinRefundClick={
                        challenge.canClaimCreatorSplitWinRefund ? onSplitWinRefundOpen : undefined
                      }
                    />
                  </Box>
                )}
                <IconButton aria-label="share" variant="ghost" size="sm" onClick={onShareOpen}>
                  <Icon as={UilShareAlt} color="icon.subtle" />
                </IconButton>
              </HStack>
            </HStack>
          </HStack>

          <Heading
            textStyle={{ base: "2xl", md: "4xl" }}
            lineHeight="1.02"
            wordBreak="break-word"
            overflowWrap="anywhere">
            {challengeTitle}
          </Heading>

          <Text textStyle={{ base: "sm", md: "md" }} color="text.subtle">
            {challengeDescription}
          </Text>

          <Badge
            variant={getChallengeStatusBadgeVariant(challenge)}
            size="md"
            w="fit-content"
            maxW="full"
            whiteSpace="normal"
            textAlign="left">
            {statusTimeLabel ?? getChallengeInvalidReason(challenge, t) ?? t(challengeStatusLabel(challenge.status))}
          </Badge>

          {hasChallengeActions(challenge) && (
            <Box display={{ base: "block", md: "none" }}>
              <ChallengeActions
                challenge={challenge}
                layout="card"
                onClaimClick={challenge.canClaim ? onClaimOpen : undefined}
                onAcceptClick={challenge.canAccept ? onAcceptOpen : undefined}
                onDeclineClick={challenge.canDecline ? onDeclineOpen : undefined}
                onCancelClick={challenge.canCancel ? onCancelOpen : undefined}
                onRefundClick={challenge.canRefund ? onRefundOpen : undefined}
                onJoinClick={challenge.canJoin ? onJoinOpen : undefined}
                onLeaveClick={challenge.canLeave ? onLeaveOpen : undefined}
                onCompleteClick={challenge.canComplete ? onCompleteOpen : undefined}
                onClaimSplitWinClick={challenge.canClaimSplitWin ? onSplitWinClaimOpen : undefined}
                onClaimCreatorSplitWinRefundClick={
                  challenge.canClaimCreatorSplitWinRefund ? onSplitWinRefundOpen : undefined
                }
              />
            </Box>
          )}
        </VStack>
      </Card.Root>

      <ChallengeShareModal isOpen={isShareOpen} onClose={onShareClose} challengeTitle={challengeTitle} />
      <ChallengeClaimModal
        isOpen={isClaimOpen}
        onClose={onClaimClose}
        prizeLabel={claimPrizeLabel}
        onClaim={() => actions.claimChallenge(challenge.challengeId)}
      />
      <ChallengeAcceptModal
        isOpen={isAcceptOpen}
        onClose={onAcceptClose}
        stakeLabel={challenge.kind === ChallengeKind.Stake ? stakeLabel : undefined}
        onAccept={() => actions.acceptChallenge(challenge)}
      />
      <ChallengeDeclineModal
        isOpen={isDeclineOpen}
        onClose={onDeclineClose}
        onDecline={() => actions.declineChallenge(challenge.challengeId)}
      />
      <ChallengeCancelModal
        isOpen={isCancelOpen}
        onClose={onCancelClose}
        onCancel={() => actions.cancelChallenge(challenge.challengeId)}
      />
      <ChallengeRefundModal
        isOpen={isRefundOpen}
        onClose={onRefundClose}
        stakeLabel={stakeLabel}
        onRefund={() => actions.refundChallenge(challenge.challengeId)}
      />
      <ChallengeJoinModal
        isOpen={isJoinOpen}
        onClose={onJoinClose}
        stakeLabel={challenge.kind === ChallengeKind.Stake ? stakeLabel : undefined}
        onJoin={() => actions.joinChallenge(challenge)}
      />
      <ChallengeLeaveModal
        isOpen={isLeaveOpen}
        onClose={onLeaveClose}
        onLeave={() => actions.leaveChallenge(challenge)}
      />
      <ChallengeCompleteModal
        isOpen={isCompleteOpen}
        onClose={onCompleteClose}
        onComplete={() => actions.completeChallenge(challenge.challengeId)}
      />
      <ChallengeSplitWinClaimModal
        isOpen={isSplitWinClaimOpen}
        onClose={onSplitWinClaimClose}
        prizeLabel={perWinnerLabel}
        slotsRemaining={slotsLeft}
        onClaim={() => actions.claimSplitWinPrize(challenge.challengeId)}
      />
      <ChallengeSplitWinCreatorRefundModal
        isOpen={isSplitWinRefundOpen}
        onClose={onSplitWinRefundClose}
        refundLabel={splitWinRefundLabel}
        unclaimedSlots={slotsLeft}
        onRefund={() => actions.claimCreatorSplitWinRefund(challenge.challengeId)}
      />
    </>
  )
}
