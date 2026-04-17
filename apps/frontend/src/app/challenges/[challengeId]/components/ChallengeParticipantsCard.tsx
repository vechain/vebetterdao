import { Badge, Button, Card, Heading, HStack, Icon, Separator, Skeleton, Text, VStack } from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { Group, UserPlus } from "iconoir-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { type ChallengeDetail, ChallengeKind, ChallengeStatus, ThresholdMode } from "@/api/challenges/types"
import { useChallengeParticipantActions } from "@/api/challenges/useChallengeParticipantActions"

import { AddChallengeInvitesModal } from "../../shared/AddChallengeInvitesModal"

import { ChallengeActionsRow } from "./ChallengeActionsRow"
import { ChallengeLeaderboardModal } from "./ChallengeLeaderboardModal"
import { ChallengeShareButton } from "./ChallengeShareButton"

const LEADERBOARD_SIZE = 3
const PENDING_SIZE = 3

const MOCK_ROWS = Array.from({ length: LEADERBOARD_SIZE }, (_, i) => ({
  position: i + 1,
  address: `0x${"0".repeat(40)}`,
  score: 0,
}))

interface ChallengeParticipantsCardProps {
  challenge: ChallengeDetail
}

export const ChallengeParticipantsCard = ({ challenge }: ChallengeParticipantsCardProps) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isPending = challenge.status === ChallengeStatus.Pending
  const isSponsored = challenge.kind === ChallengeKind.Sponsored
  const threshold = Number(challenge.threshold)
  const hasThreshold = isSponsored && challenge.thresholdMode !== ThresholdMode.None && threshold > 0
  const showTrophy = !isPending

  const winCondition = useMemo(() => {
    if (!isSponsored) return t("Top scorer wins the entire prize pool")

    if (hasThreshold && challenge.thresholdMode === ThresholdMode.SplitAboveThreshold)
      return t("Complete {{count}} actions to qualify and split the prize", { count: threshold })

    if (hasThreshold && challenge.thresholdMode === ThresholdMode.TopAboveThreshold)
      return t("Top scorer among those with {{count}}+ actions wins", { count: threshold })

    return t("Top scorer wins the prize")
  }, [isSponsored, hasThreshold, challenge.thresholdMode, threshold, t])

  const { data, isLoading } = useChallengeParticipantActions(challenge.challengeId, challenge.participants)

  const leaderboard = useMemo(() => data?.leaderboard ?? [], [data?.leaderboard])

  const rankings = useMemo(
    () =>
      leaderboard.slice(0, LEADERBOARD_SIZE).map(entry => ({
        position: entry.position,
        address: entry.participant,
        score: entry.actions,
      })),
    [leaderboard],
  )

  const viewerRanking = useMemo(() => {
    if (!account?.address) return undefined
    const entry = leaderboard.find(e => AddressUtils.compareAddresses(e.participant, account.address ?? ""))
    if (!entry) return undefined
    return {
      position: entry.position,
      address: account.address,
      score: entry.actions,
    }
  }, [leaderboard, account?.address])

  const isViewerInTop = rankings.some(r => AddressUtils.compareAddresses(r.address, account?.address ?? ""))

  const inviteButton = challenge.canAddInvites ? (
    <AddChallengeInvitesModal
      challengeId={challenge.challengeId}
      creatorAddress={challenge.creator}
      existingInvitees={challenge.invited}>
      <Button size="sm" variant="primary" aria-label={t("Invite users")}>
        {t("Invite")}
        <Icon as={UserPlus} boxSize="3" />
      </Button>
    </AddChallengeInvitesModal>
  ) : (
    <ChallengeShareButton challengeTitle={challenge.title ?? ""} />
  )

  const pendingTag = challenge.isCreator ? t("Invite pending") : undefined

  const allPendingInvitees = challenge.isCreator && isPending ? challenge.invited : []

  const pendingInviteeRows = allPendingInvitees
    .slice(0, PENDING_SIZE)
    .map(address => (
      <ChallengeActionsRow
        key={`pending-${address}`}
        position={0}
        address={address}
        score={0}
        tag={pendingTag}
        hideScore
      />
    ))

  const hasOverflow = leaderboard.length > LEADERBOARD_SIZE || allPendingInvitees.length > PENDING_SIZE

  const hasNoUsers = challenge.participants.length === 0 && allPendingInvitees.length === 0

  const renderContent = () => {
    if (isPending && hasNoUsers) {
      return (
        <VStack gap={3} align="center" w="full" py={6}>
          <Icon as={Group} boxSize="10" color="icon.subtle" />
          <Text textStyle="sm" color="text.subtle" textAlign="center">
            {t("No participant joined this quest yet")}
          </Text>
          {inviteButton}
        </VStack>
      )
    }

    if (isLoading) {
      return MOCK_ROWS.map(row => <Skeleton key={row.position} borderRadius="lg" h="72px" />)
    }

    if (!rankings.length && pendingInviteeRows.length === 0) {
      return (
        <VStack gap={4} align="stretch" w="full" h="full" pos="relative">
          <VStack
            pos="absolute"
            backdropFilter="blur(10px)"
            borderRadius="xl"
            top={0}
            left={0}
            w="full"
            justify="center"
            gap={1}
            p={4}
            h="full"
            zIndex={2}
            bg="transparency.100">
            <Heading size="md">{t("No participants yet")}</Heading>
            <Text textStyle="sm" color="text.subtle" textAlign="center">
              {t("Be the first to participate and climb the leaderboard!")}
            </Text>
          </VStack>
          {MOCK_ROWS.map(row => (
            <ChallengeActionsRow key={row.position} {...row} />
          ))}
        </VStack>
      )
    }

    return (
      <>
        {rankings.map(ranking => (
          <ChallengeActionsRow
            key={ranking.address}
            {...ranking}
            showTrophy={showTrophy}
            hideScore={isPending}
            isYou={AddressUtils.compareAddresses(ranking.address, account?.address ?? "")}
          />
        ))}
        {pendingInviteeRows.length > 0 && (
          <>
            <Separator w="full" h={1} color="border.secondary" />
            {pendingInviteeRows}
          </>
        )}
      </>
    )
  }

  return (
    <>
      <Card.Root variant="primary" p={{ base: "4", md: "6" }} gap="6" height={{ base: "max-content", md: "auto" }}>
        <Card.Header gap="4" p="0">
          <HStack justifyContent="space-between">
            <HStack gap={4}>
              <Heading as={HStack} size={{ base: "md", md: "lg" }} fontWeight="semibold">
                <Icon as={Group} boxSize="5" color="icon.default" />
                {t("Participants")}
              </Heading>
              <Badge variant="neutral" size="sm" rounded="sm">
                {humanNumber(challenge.participantCount)} {" / "} {humanNumber(challenge.maxParticipants)}
              </Badge>
            </HStack>
            {challenge.participants.length > 0 && inviteButton}
          </HStack>
          <VStack gap={1} align="start">
            <Text textStyle="sm" color="text.subtle">
              {isPending
                ? t("Quest hasn't started yet. You can track the progress of the quest once it starts.")
                : t("Track your progress and see who is leading the quest.")}
            </Text>
            <Text textStyle="sm" color="text.subtle" fontWeight="semibold">
              {winCondition}
              {"!"}
            </Text>
          </VStack>
        </Card.Header>
        <Card.Body p="0">
          <VStack gap={4} align="stretch" w="full">
            {renderContent()}
            {!isViewerInTop && viewerRanking && !isLoading && (
              <>
                <Separator w="full" h={1} color="border.secondary" />
                <ChallengeActionsRow {...viewerRanking} isYou showTrophy={showTrophy} hideScore={isPending} />
              </>
            )}
          </VStack>
        </Card.Body>
        {hasOverflow && (
          <Card.Footer p="0" justifyContent="center">
            <Button variant="link" fontWeight="semibold" onClick={() => setIsModalOpen(true)}>
              {t("See all participants")}
            </Button>
          </Card.Footer>
        )}
      </Card.Root>

      <ChallengeLeaderboardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        challenge={challenge}
        leaderboard={leaderboard}
        isLoading={isLoading}
        pendingInvitees={allPendingInvitees}
      />
    </>
  )
}
