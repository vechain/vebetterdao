import {
  Badge,
  Card,
  Heading,
  HStack,
  Icon,
  IconButton,
  LinkBox,
  Text,
  useDisclosure,
  VStack,
  Wrap,
} from "@chakra-ui/react"
import { UilShareAlt } from "@iconscout/react-unicons"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { ChallengeDetail, ChallengeKind, ChallengeStatus, challengeStatusLabel } from "@/api/challenges/types"
import { useChallengeActions } from "@/api/challenges/useChallengeActions"
import { useChallengeStatusTime } from "@/api/challenges/useChallengeStatusTime"
import { AddressIcon } from "@/components/AddressIcon"
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
  const challengeTitle = challenge.title || t("Quest #{{id}}", { id: challenge.challengeId })
  const totalPotential = Number(challenge.totalPrize) + Number(challenge.stakeAmount)
  const prizeLabel = humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")
  const potentialLabel = humanNumber(totalPotential, totalPotential, "B3TR")
  const stakeLabel = humanNumber(challenge.stakeAmount, challenge.stakeAmount, "B3TR")
  const baseParams = {
    prize: potentialLabel,
    max: humanNumber(challenge.maxParticipants),
    duration: challenge.duration,
  }

  const challengeDescription = (() => {
    if (challenge.canClaim) return t("You won! {{prize}} is yours — claim your prize now.", { prize: prizeLabel })
    if (challenge.canRefund)
      return t("Quest ended — your {{stake}} stake is ready to be refunded.", { stake: stakeLabel })
    if (challenge.status === ChallengeStatus.Finalized)
      return t("Quest complete — {{prize}} has been distributed to the winners.", { prize: prizeLabel })
    if (challenge.status === ChallengeStatus.Cancelled) return t("This quest was cancelled. Stakes have been refunded.")
    if (challenge.isJoined)
      return isSponsored
        ? t("You're in! Compete for {{prize}} — {{duration}} rounds to prove yourself.", {
            prize: prizeLabel,
            duration: challenge.duration,
          })
        : t("You're in! {{stake}} staked — compete for {{prize}} over {{duration}} rounds.", {
            stake: stakeLabel,
            prize: potentialLabel,
            duration: challenge.duration,
          })
    if (challenge.canAccept)
      return isSponsored
        ? t("You've been invited! {{prize}} up for grabs — accept and join the action.", { prize: prizeLabel })
        : t("You've been invited! Stake {{stake}} for a shot at {{prize}} — accept to join.", {
            stake: stakeLabel,
            prize: potentialLabel,
          })
    if (challenge.canJoin)
      return isSponsored
        ? t(
            "{{prize}} up for grabs — {{max}} slots, {{duration}} rounds. No stake needed, just bring your A-game.",
            baseParams,
          )
        : t(
            "Put {{stake}} on the line for a shot at {{prize}} — {{max}} players, {{duration}} rounds, one winner takes all.",
            { ...baseParams, stake: stakeLabel },
          )
    return isSponsored
      ? t(
          "{{prize}} up for grabs — {{max}} slots, {{duration}} rounds. No stake needed, just bring your A-game.",
          baseParams,
        )
      : t(
          "Put {{stake}} on the line for a shot at {{prize}} — {{max}} players, {{duration}} rounds, one winner takes all.",
          { ...baseParams, stake: stakeLabel },
        )
  })()

  return (
    <>
      <Card.Root variant="primary" p="4" w="full">
        <VStack align="stretch" gap="4">
          <HStack justify="space-between" align="start">
            <Wrap gap="2">
              <ChallengeVisibilityBadge challenge={challenge} />
              <Badge variant={getChallengeStatusBadgeVariant(challenge.status)} size="sm">
                {statusTimeLabel ?? t(challengeStatusLabel(challenge.status))}
              </Badge>
            </Wrap>

            <HStack gap="2" flexShrink={0}>
              {hasChallengeActions(challenge) && (
                <ChallengeActions
                  challenge={challenge}
                  buttonSize="sm"
                  onClaimClick={challenge.canClaim ? onClaimOpen : undefined}
                />
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

          <HStack
            as={LinkBox}
            w="fit-content"
            gap="1.5"
            bg="bg.secondary"
            borderRadius="full"
            px="2.5"
            py="1.5"
            align="center"
            cursor="pointer"
            _hover={{ opacity: 0.7 }}
            onClick={() => router.push(`/profile/${challenge.creator}`)}>
            <AddressIcon address={challenge.creator} boxSize="4" borderRadius="full" />
            <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
              {creatorDisplayName}
            </Text>
          </HStack>
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
