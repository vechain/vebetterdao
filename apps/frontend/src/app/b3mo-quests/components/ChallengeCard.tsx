import {
  Badge,
  Box,
  Card,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  useDisclosure,
  VStack,
  Wrap,
  Button,
} from "@chakra-ui/react"
import { getCompactFormatter, humanNumber } from "@repo/utils/FormattingUtils"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { LuClock, LuTarget, LuTicket, LuTrophy, LuUsers } from "react-icons/lu"

import { ChallengeKind, ChallengeType, ChallengeView, ParticipantStatus, SettlementMode } from "@/api/challenges/types"
import { useChallengeActions } from "@/api/challenges/useChallengeActions"
import B3trSvg from "@/components/Icons/svg/b3tr.svg"

import { ChallengeAcceptModal } from "../[challengeId]/components/ChallengeAcceptModal"
import { ChallengeCancelModal } from "../[challengeId]/components/ChallengeCancelModal"
import { ChallengeClaimModal } from "../[challengeId]/components/ChallengeClaimModal"
import { ChallengeCompleteModal } from "../[challengeId]/components/ChallengeCompleteModal"
import { ChallengeDeclineModal } from "../[challengeId]/components/ChallengeDeclineModal"
import { ChallengeJoinModal } from "../[challengeId]/components/ChallengeJoinModal"
import { ChallengeLeaveModal } from "../[challengeId]/components/ChallengeLeaveModal"
import { ChallengeRefundModal } from "../[challengeId]/components/ChallengeRefundModal"
import { ChallengeSplitWinClaimModal } from "../[challengeId]/components/ChallengeSplitWinClaimModal"
import { ChallengeSplitWinCreatorRefundModal } from "../[challengeId]/components/ChallengeSplitWinCreatorRefundModal"
import { ChallengeActions, hasChallengeActions } from "../shared/ChallengeActions"
import { ChallengeEligibleAppsRow } from "../shared/ChallengeEligibleAppsRow"
import {
  ChallengeStatusBadge,
  ChallengeVisibilityBadge,
  ChallengeWinnerTypeBadge,
} from "../shared/ChallengeStatusBadges"
import { useChallengeDescription } from "../shared/useChallengeDescription"

interface ChallengeCardProps {
  challenge: ChallengeView
}

export const ChallengeCard = ({ challenge }: ChallengeCardProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const actions = useChallengeActions()
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

  const isSponsored = challenge.kind === ChallengeKind.Sponsored
  const isSplitWin = challenge.challengeType === ChallengeType.SplitWin
  const isReacceptingInvite = challenge.canAccept && challenge.viewerStatus === ParticipantStatus.Declined
  const challengeTitle = challenge.title || t("Challenge #{{id}}", { id: challenge.challengeId })
  const challengeDescription = useChallengeDescription(challenge)

  const prizeLabel = `${getCompactFormatter(2).format(Number(challenge.totalPrize))} B3TR`
  const stakeLabel = humanNumber(challenge.stakeAmount, challenge.stakeAmount, "B3TR")
  const perWinnerLabel = humanNumber(challenge.prizePerWinner, challenge.prizePerWinner, "B3TR")
  // Max Actions splits the pool equally across tied top scorers (matches contract _payoutAmount).
  // totalPrize is an ether-formatted decimal string (see buildChallengeView), so divide as Number.
  const claimShare =
    challenge.settlementMode === SettlementMode.TopWinners && challenge.bestCount > 1
      ? (Number(challenge.totalPrize) / challenge.bestCount).toString()
      : challenge.totalPrize
  const claimPrizeLabel = `${getCompactFormatter(2).format(Number(claimShare))} B3TR`
  const slotsLeft = Math.max(challenge.numWinners - challenge.winnersClaimed, 0)
  const allSlotsClaimed = isSplitWin && challenge.winnersClaimed >= challenge.numWinners
  const splitWinRefundLabel = humanNumber(
    String(slotsLeft * Number(challenge.prizePerWinner)),
    String(slotsLeft * Number(challenge.prizePerWinner)),
    "B3TR",
  )

  return (
    <>
      <Card.Root variant="outline" h="full" overflow="hidden">
        <Card.Body>
          <VStack gap="4" align="stretch" h="full">
            <Stack
              direction={isReacceptingInvite ? "column" : { base: "column", md: "row" }}
              justify="space-between"
              align={isReacceptingInvite ? "stretch" : { base: "stretch", md: "start" }}
              gap="4">
              <VStack align="start" gap="3" flex="1" minW="0">
                <Wrap gap="2">
                  <ChallengeVisibilityBadge challenge={challenge} />
                  <ChallengeWinnerTypeBadge challenge={challenge} />
                  {allSlotsClaimed && (
                    <Badge variant="neutral" size="sm">
                      {t("All slots claimed")}
                    </Badge>
                  )}
                </Wrap>
                <HStack gap="2" align="start" w="full" minW="0">
                  <Heading
                    textStyle={{ base: "lg", md: "xl" }}
                    lineHeight="1.1"
                    lineClamp={2}
                    title={challengeTitle}
                    wordBreak="break-word"
                    overflowWrap="anywhere"
                    flex="1"
                    minW="0">
                    {challengeTitle}
                  </Heading>
                  <Box flexShrink={0}>
                    <ChallengeStatusBadge challenge={challenge} outlined />
                  </Box>
                </HStack>
                <Text textStyle="sm" color="text.subtle">
                  {challengeDescription}
                </Text>
              </VStack>
            </Stack>

            <VStack gap="1" py="2" px="3" bg="bg.secondary" borderRadius="xl" align="start">
              <ChallengeEligibleAppsRow challenge={challenge} />
              <SimpleGrid columns={{ base: 2, md: 2 }} gap="3" py="2" px="3" w="full">
                <VStack gap="1" align="start">
                  <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
                    {isSplitWin ? t("Prize per winner") : t("Prize")}
                  </Text>
                  <HStack gap="2">
                    <HStack
                      justify="center"
                      align="center"
                      w="7"
                      h="7"
                      rounded="full"
                      bg="status.warning.subtle"
                      color="status.warning.primary"
                      flexShrink={0}>
                      <Icon as={B3trSvg} boxSize={4} />
                    </HStack>
                    <Text textStyle="md" fontWeight="bold" color="brand.primary">
                      {isSplitWin ? perWinnerLabel : prizeLabel}
                    </Text>
                  </HStack>
                </VStack>
                {isSplitWin ? (
                  <VStack gap="1" align="start">
                    <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
                      {t("Winners")}
                    </Text>
                    <HStack gap="2">
                      <HStack
                        justify="center"
                        align="center"
                        w="7"
                        h="7"
                        rounded="full"
                        bg="status.info.subtle"
                        color="status.info.primary"
                        flexShrink={0}>
                        <Icon boxSize={4}>
                          <LuTrophy />
                        </Icon>
                      </HStack>
                      <Text textStyle="md" fontWeight="bold">
                        {humanNumber(challenge.winnersClaimed)}
                        <Text as="span" color="text.subtle" fontWeight="semibold">
                          {" / "}
                          {humanNumber(challenge.numWinners)}
                        </Text>
                      </Text>
                    </HStack>
                  </VStack>
                ) : (
                  <VStack gap="1" align="start">
                    <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
                      {t("Participants")}
                    </Text>
                    <HStack gap="2">
                      <HStack
                        justify="center"
                        align="center"
                        w="7"
                        h="7"
                        rounded="full"
                        bg="status.info.subtle"
                        color="status.info.primary"
                        flexShrink={0}>
                        <Icon boxSize={4}>
                          <LuUsers />
                        </Icon>
                      </HStack>
                      <Text textStyle="md" fontWeight="bold">
                        {humanNumber(challenge.participantCount)}
                        <Text as="span" color="text.subtle" fontWeight="semibold">
                          {" / "}
                          {humanNumber(challenge.maxParticipants)}
                        </Text>
                      </Text>
                    </HStack>
                  </VStack>
                )}
              </SimpleGrid>
            </VStack>

            <Wrap gap="2">
              {!isSponsored && (
                <Badge variant="neutral" size="sm">
                  <Icon boxSize={3}>
                    <LuTicket />
                  </Icon>
                  {t("Stake")} {stakeLabel}
                </Badge>
              )}
              <Badge variant="neutral" size="sm">
                <Icon boxSize={3}>
                  <LuClock />
                </Icon>
                {challenge.duration} {challenge.duration === 1 ? t("Round") : t("Rounds")}
              </Badge>
              {isSplitWin && (
                <Badge variant="neutral" size="sm">
                  <Icon boxSize={3}>
                    <LuTarget />
                  </Icon>
                  {t("Reach {{actions}} actions to claim", { actions: humanNumber(challenge.threshold) })}
                </Badge>
              )}
              {!isSplitWin && challenge.threshold !== "0" && (
                <Badge variant="neutral" size="sm">
                  <Icon boxSize={3}>
                    <LuTarget />
                  </Icon>
                  {t("Minimum actions")} {humanNumber(challenge.threshold)}
                </Badge>
              )}
            </Wrap>
          </VStack>
        </Card.Body>
        <Card.Footer mt={4}>
          <VStack gap="3" w="full" align="stretch">
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
            <HStack gap="2" w="full" align="stretch">
              {hasChallengeActions(challenge) && (
                <Box flex="1" minW="0">
                  <ChallengeActions
                    challenge={challenge}
                    layout="card"
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
              <Button
                variant="secondary"
                size="sm"
                flex="1"
                minW="0"
                onClick={() => router.push(`/b3mo-quests/${challenge.challengeId}`)}>
                {t("View details")}
              </Button>
            </HStack>
          </VStack>
        </Card.Footer>
      </Card.Root>

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
