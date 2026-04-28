import {
  Badge,
  Button,
  Card,
  Heading,
  HStack,
  Icon,
  Progress,
  Separator,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import BigNumber from "bignumber.js"
import { Group } from "iconoir-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { type ChallengeDetail, ChallengeKind, ChallengeStatus, ChallengeType } from "@/api/challenges/types"
import { useChallengeParticipantActions } from "@/api/challenges/useChallengeParticipantActions"

import { AddChallengeInvitesModal } from "../../shared/AddChallengeInvitesModal"

import { ChallengeActionsRow } from "./ChallengeActionsRow"
import { ChallengeLeaderboardModal } from "./ChallengeLeaderboardModal"
import { ChallengeShareButton } from "./ChallengeShareButton"
import { ChallengeUserActionsModal, type ChallengeUserActionsParticipant } from "./ChallengeUserActionsModal"

const LEADERBOARD_SIZE = 4
const PENDING_SIZE = 4

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
  const [selectedParticipant, setSelectedParticipant] = useState<ChallengeUserActionsParticipant | null>(null)

  const isPending = challenge.status === ChallengeStatus.Pending
  const isSponsored = challenge.kind === ChallengeKind.Sponsored
  const isSplitWin = challenge.challengeType === ChallengeType.SplitWin
  const threshold = Number(challenge.threshold)
  const showTrophy = !isPending

  const showPrizeProgress =
    isSplitWin &&
    challenge.numWinners > 0 &&
    (challenge.status === ChallengeStatus.Active || challenge.status === ChallengeStatus.Completed)

  const claimedPrize = useMemo(
    () => new BigNumber(challenge.prizePerWinner || "0").times(challenge.winnersClaimed).toFixed(),
    [challenge.prizePerWinner, challenge.winnersClaimed],
  )

  const claimedPercent = useMemo(() => {
    if (!challenge.numWinners) return 0
    return Math.min(100, (challenge.winnersClaimed / challenge.numWinners) * 100)
  }, [challenge.numWinners, challenge.winnersClaimed])

  const winCondition = useMemo(() => {
    if (isSplitWin) return t("Reach {{threshold}} actions and claim a slot before they run out", { threshold })

    if (!isSponsored) return t("Top scorer wins the entire prize pool")

    return t("Top scorer wins the prize")
  }, [isSponsored, isSplitWin, threshold, t])

  const { leaderboard, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, loadedCount, totalCount } =
    useChallengeParticipantActions(challenge.challengeId, challenge.participants)

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

  const hasOverflow = totalCount > LEADERBOARD_SIZE || allPendingInvitees.length > PENDING_SIZE

  const hasNoUsers = challenge.participants.length === 0 && allPendingInvitees.length === 0

  const renderContent = () => {
    if (isPending && hasNoUsers) {
      return (
        <VStack gap={3} align="center" w="full" py={6}>
          <Icon as={Group} boxSize="10" color="icon.subtle" />
          <Text textStyle="sm" color="text.subtle" textAlign="center">
            {t("No participant joined this B3MO quest yet")}
          </Text>
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
            position={isPending ? 0 : ranking.position}
            tag={isPending ? t("Joined") : undefined}
            showTrophy={showTrophy}
            hideScore={isPending}
            isYou={AddressUtils.compareAddresses(ranking.address, account?.address ?? "")}
            onClick={() => setSelectedParticipant(ranking)}
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
                {humanNumber(challenge.participantCount)}
                {!isSplitWin && ` / ${humanNumber(challenge.maxParticipants)}`}
              </Badge>
            </HStack>
            {inviteButton}
          </HStack>
          <VStack gap={1} align="start">
            <Text textStyle="sm" color="text.subtle">
              {isPending
                ? t("B3MO Quest hasn't started yet. You can track the progress of the B3MO quest once it starts.")
                : t("Track your progress and see who is leading the B3MO quest.")}
            </Text>
            <Text textStyle="sm" color="text.subtle" fontWeight="semibold">
              {winCondition}
              {"!"}
            </Text>
          </VStack>
          {showPrizeProgress && (
            <VStack gap={2} align="stretch" w="full">
              <HStack justify="space-between" align="baseline">
                <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
                  {t("Prize claimed")}
                </Text>
                <Text textStyle="xs" color="text.subtle">
                  {humanNumber(claimedPrize, claimedPrize, "B3TR")}
                  {" / "}
                  {humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")}
                </Text>
              </HStack>
              <Progress.Root value={claimedPercent} size="sm" w="full">
                <Progress.Track rounded="full">
                  <Progress.Range bgColor="status.positive.primary" rounded="full" />
                </Progress.Track>
              </Progress.Root>
            </VStack>
          )}
        </Card.Header>
        <Card.Body p="0">
          <VStack gap={4} align="stretch" w="full">
            {renderContent()}
            {!isViewerInTop && viewerRanking && !isLoading && (
              <>
                <Separator w="full" h={1} color="border.secondary" />
                <ChallengeActionsRow
                  {...viewerRanking}
                  position={isPending ? 0 : viewerRanking.position}
                  tag={isPending ? t("Joined") : undefined}
                  isYou
                  showTrophy={showTrophy}
                  hideScore={isPending}
                  onClick={() => setSelectedParticipant(viewerRanking)}
                />
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
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        loadedCount={loadedCount}
        totalCount={totalCount}
      />

      <ChallengeUserActionsModal
        onClose={() => setSelectedParticipant(null)}
        challenge={challenge}
        participant={selectedParticipant}
      />
    </>
  )
}
