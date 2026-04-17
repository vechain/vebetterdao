import {
  Badge,
  Box,
  Card,
  Heading,
  HStack,
  Icon,
  IconButton,
  LinkBox,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { UilShareAlt } from "@iconscout/react-unicons"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { LuUserRound } from "react-icons/lu"

import {
  ChallengeDetail,
  ChallengeKind,
  ChallengeStatus,
  challengeStatusLabel,
  ThresholdMode,
} from "@/api/challenges/types"
import { useChallengeActions } from "@/api/challenges/useChallengeActions"
import { useChallengeStatusTime } from "@/api/challenges/useChallengeStatusTime"
import { useGetVetDomains } from "@/hooks/useGetVetDomains"

import { ChallengeActions, hasChallengeActions } from "../../shared/ChallengeActions"
import { getChallengeStatusBadgeVariant } from "../../shared/challengeBadgeVariants"
import { ChallengeVisibilityBadge } from "../../shared/ChallengeStatusBadges"

import { ChallengeClaimModal } from "./ChallengeClaimModal"
import { ChallengeShareModal } from "./ChallengeShareModal"

interface ChallengeHeaderCardProps {
  challenge: ChallengeDetail
}

export const ChallengeHeaderCard = ({ challenge }: ChallengeHeaderCardProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const statusTime = useChallengeStatusTime(challenge)
  const actions = useChallengeActions()
  const { onOpen: onShareOpen, onClose: onShareClose, open: isShareOpen } = useDisclosure()
  const { onOpen: onClaimOpen, onClose: onClaimClose, open: isClaimOpen } = useDisclosure()
  const { data: vetDomains } = useGetVetDomains(challenge.creator ? [challenge.creator] : undefined)
  const creatorDisplayName = vetDomains?.[0] ?? humanAddress(challenge.creator, 6, 4)

  const statusTimeLabel = (() => {
    if (!statusTime) return null
    const time = statusTime.fromNow()
    switch (challenge.status) {
      case ChallengeStatus.Pending:
        return t("Starts {{time}}", { time })
      case ChallengeStatus.Active:
        return t("Ends {{time}}", { time })
      case ChallengeStatus.Finalized:
        return t("Ended {{time}}", { time })
      default:
        return null
    }
  })()

  const isSponsored = challenge.kind === ChallengeKind.Sponsored
  const isStake = challenge.kind === ChallengeKind.Stake
  const isSplit = isSponsored && challenge.thresholdMode === ThresholdMode.SplitAboveThreshold
  const challengeTitle = challenge.title || t("Quest #{{id}}", { id: challenge.challengeId })

  // For Stake quests, the user's own stake adds to the pool when they join.
  // Once joined, totalPrize already includes their stake, so the win amount is just totalPrize.
  const totalPrizeNum = Number(challenge.totalPrize)
  const stakeAmountNum = Number(challenge.stakeAmount)
  const prizeAfterIJoin = isStake ? totalPrizeNum + stakeAmountNum : totalPrizeNum

  // For Sponsored Split quests, prize is divided across qualified winners.
  // Pre-finalization we estimate using participantCount; +1 if the user would be a new participant.
  const splitDivisor = Math.max(challenge.participantCount + (challenge.isJoined ? 0 : 1), 1)
  const perWinnerCurrent = Math.floor(totalPrizeNum / Math.max(challenge.participantCount, 1))
  const perWinnerAfterIJoin = Math.floor(prizeAfterIJoin / splitDivisor)

  const prizeLabel = humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")
  const potentialLabel = humanNumber(prizeAfterIJoin, prizeAfterIJoin, "B3TR")
  const stakeLabel = humanNumber(challenge.stakeAmount, challenge.stakeAmount, "B3TR")
  const perWinnerCurrentLabel = humanNumber(perWinnerCurrent, perWinnerCurrent, "B3TR")
  const perWinnerAfterIJoinLabel = humanNumber(perWinnerAfterIJoin, perWinnerAfterIJoin, "B3TR")
  const maxLabel = humanNumber(challenge.maxParticipants)

  const challengeDescription = (() => {
    if (challenge.canClaim) return t("You won! {{prize}} is yours — claim your prize now.", { prize: prizeLabel })
    if (challenge.canRefund)
      return t("Quest ended — your {{stake}} stake is ready to be refunded.", { stake: stakeLabel })
    if (challenge.status === ChallengeStatus.Finalized)
      return t("Quest complete — {{prize}} has been distributed to the winners.", { prize: prizeLabel })
    if (challenge.status === ChallengeStatus.Cancelled) return t("This quest was cancelled. Stakes have been refunded.")
    if (challenge.isJoined) {
      if (isSplit)
        return t("You're in! Compete for up to {{prize}} per winner — {{duration}} rounds to prove yourself.", {
          prize: perWinnerCurrentLabel,
          duration: challenge.duration,
        })
      if (isSponsored)
        return t("You're in! Compete for {{prize}} — {{duration}} rounds to prove yourself.", {
          prize: prizeLabel,
          duration: challenge.duration,
        })
      return t("You're in! {{stake}} staked — compete for {{prize}} over {{duration}} rounds.", {
        stake: stakeLabel,
        prize: prizeLabel,
        duration: challenge.duration,
      })
    }
    if (challenge.canAccept) {
      if (isSplit)
        return t("You've been invited! Up to {{prize}} per winner — accept and join the action.", {
          prize: perWinnerAfterIJoinLabel,
        })
      if (isSponsored)
        return t("You've been invited! {{prize}} up for grabs — accept and join the action.", { prize: prizeLabel })
      return t("You've been invited! Stake {{stake}} for a shot at {{prize}} — accept to join.", {
        stake: stakeLabel,
        prize: potentialLabel,
      })
    }
    if (isSplit)
      return t(
        "Up to {{prize}} per winner — {{max}} slots, {{duration}} rounds. No stake needed, just bring your A-game.",
        { prize: perWinnerAfterIJoinLabel, max: maxLabel, duration: challenge.duration },
      )
    if (isSponsored)
      return t(
        "{{prize}} up for grabs — {{max}} slots, {{duration}} rounds. No stake needed, just bring your A-game.",
        { prize: prizeLabel, max: maxLabel, duration: challenge.duration },
      )
    return t(
      "Put {{stake}} on the line for a shot at {{prize}} — {{max}} players, {{duration}} rounds, one winner takes all.",
      { stake: stakeLabel, prize: potentialLabel, max: maxLabel, duration: challenge.duration },
    )
  })()

  return (
    <>
      <Card.Root variant="primary" p="4" w="full">
        <VStack align="stretch" gap="4">
          <HStack justify="space-between" align="start">
            <HStack gap="1.5">
              <ChallengeVisibilityBadge challenge={challenge} />

              <HStack
                as={LinkBox}
                w="fit-content"
                gap="1"
                bg="bg.secondary"
                borderRadius="full"
                px="2"
                py="0.5"
                align="center"
                cursor="pointer"
                _hover={{ opacity: 0.7 }}
                onClick={() => router.push(`/profile/${challenge.creator}`)}>
                <Icon as={LuUserRound} boxSize="3" />
                {/* <AddressIcon address={challenge.creator} boxSize="4" borderRadius="full" /> */}
                <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
                  {creatorDisplayName}
                </Text>
              </HStack>
            </HStack>

            <HStack gap="2" flexShrink={0}>
              {hasChallengeActions(challenge) && (
                <Box display={{ base: "none", md: "block" }}>
                  <ChallengeActions
                    challenge={challenge}
                    buttonSize="sm"
                    onClaimClick={challenge.canClaim ? onClaimOpen : undefined}
                  />
                </Box>
              )}
              <IconButton aria-label="share" variant="ghost" size="sm" onClick={onShareOpen}>
                <Icon as={UilShareAlt} color="icon.subtle" />
              </IconButton>
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

          <Badge variant={getChallengeStatusBadgeVariant(challenge.status)} size="md" w="fit-content">
            {statusTimeLabel ?? t(challengeStatusLabel(challenge.status))}
          </Badge>

          {hasChallengeActions(challenge) && (
            <Box display={{ base: "block", md: "none" }}>
              <ChallengeActions
                challenge={challenge}
                layout="card"
                onClaimClick={challenge.canClaim ? onClaimOpen : undefined}
              />
            </Box>
          )}
        </VStack>
      </Card.Root>

      <ChallengeShareModal isOpen={isShareOpen} onClose={onShareClose} challengeTitle={challengeTitle} />
      <ChallengeClaimModal
        isOpen={isClaimOpen}
        onClose={onClaimClose}
        prizeLabel={prizeLabel}
        onClaim={() => actions.claimChallenge(challenge.challengeId)}
      />
    </>
  )
}
