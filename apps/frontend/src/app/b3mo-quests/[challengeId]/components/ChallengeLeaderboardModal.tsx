import { Button, Heading, Icon, Separator, Skeleton, Tabs, Text, VStack } from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { Group, SendDiagonal } from "iconoir-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { type ChallengeDetail, ChallengeStatus, ChallengeType } from "@/api/challenges/types"
import type { ChallengeParticipantActionsEntry } from "@/api/challenges/useChallengeParticipantActions"
import { BaseModal } from "@/components/BaseModal"

import { ChallengeActionsRow } from "./ChallengeActionsRow"
import { ChallengeUserActionsModal, type ChallengeUserActionsParticipant } from "./ChallengeUserActionsModal"

interface ChallengeLeaderboardModalProps {
  isOpen: boolean
  onClose: () => void
  challenge: ChallengeDetail
  leaderboard: ChallengeParticipantActionsEntry[]
  isLoading: boolean
  pendingInvitees: string[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  loadedCount: number
  totalCount: number
}

const SKELETON_COUNT = 5

export const ChallengeLeaderboardModal = ({
  isOpen,
  onClose,
  challenge,
  leaderboard,
  isLoading,
  pendingInvitees,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  loadedCount,
  totalCount,
}: ChallengeLeaderboardModalProps) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const [selectedParticipant, setSelectedParticipant] = useState<ChallengeUserActionsParticipant | null>(null)

  const isPending = challenge.status === ChallengeStatus.Pending
  const isCompleted = challenge.status === ChallengeStatus.Completed
  const isSplitWin = challenge.challengeType === ChallengeType.SplitWin

  const winnersSet = useMemo(() => new Set((challenge.winners ?? []).map(w => w.toLowerCase())), [challenge.winners])
  const isWinnerAddress = (addr: string, position: number) =>
    isSplitWin ? winnersSet.has(addr.toLowerCase()) : isCompleted && position === 1

  const rankings = useMemo(
    () =>
      leaderboard.map(entry => ({
        position: entry.position,
        address: entry.participant,
        score: entry.actions,
      })),
    [leaderboard],
  )

  const viewerIndex = useMemo(() => {
    if (!account?.address) return -1
    return rankings.findIndex(r => AddressUtils.compareAddresses(r.address, account.address ?? ""))
  }, [rankings, account?.address])

  const participantsContent = (
    <>
      {isLoading
        ? Array.from({ length: SKELETON_COUNT }, (_, i) => <Skeleton key={i} borderRadius="lg" h="72px" />)
        : rankings.map(ranking => (
            <ChallengeActionsRow
              key={ranking.address}
              {...ranking}
              position={isPending || isSplitWin ? 0 : ranking.position}
              tag={isPending ? t("Joined") : undefined}
              isWinner={isWinnerAddress(ranking.address, ranking.position)}
              hideScore={isPending}
              isYou={AddressUtils.compareAddresses(ranking.address, account?.address ?? "")}
              onClick={() => setSelectedParticipant(ranking)}
            />
          ))}

      {isFetchingNextPage &&
        Array.from({ length: SKELETON_COUNT }, (_, i) => <Skeleton key={`next-${i}`} borderRadius="lg" h="72px" />)}

      {!isLoading && viewerIndex === -1 && account?.address && (
        <>
          <Separator w="full" h={1} color="border.secondary" />
          <ChallengeActionsRow
            position={0}
            address={account.address}
            score={challenge.viewerActions}
            isYou
            isWinner={isWinnerAddress(account.address, 0)}
            hideScore={isPending}
            onClick={() =>
              setSelectedParticipant({
                address: account.address!,
                position: 0,
                score: challenge.viewerActions,
              })
            }
          />
        </>
      )}

      {!isLoading && rankings.length === 0 && !isFetchingNextPage && (
        <Text textStyle="sm" color="text.subtle" textAlign="center" py={4}>
          {t("No participant joined this B3MO quest yet")}
        </Text>
      )}

      {!isLoading && (hasNextPage || totalCount > loadedCount) && (
        <VStack gap={2} pt={2}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
            loading={isFetchingNextPage}>
            {t("Load more")}
          </Button>
          <Text textStyle="xs" color="text.subtle">
            {humanNumber(loadedCount)} {"/"} {humanNumber(totalCount)}
          </Text>
        </VStack>
      )}
    </>
  )

  const pendingContent = (
    <>
      {pendingInvitees.length > 0 ? (
        pendingInvitees.map(address => (
          <ChallengeActionsRow
            key={`pending-${address}`}
            position={0}
            address={address}
            score={0}
            tag={t("Invite pending")}
            hideScore
          />
        ))
      ) : (
        <Text textStyle="sm" color="text.subtle" textAlign="center" py={4}>
          {t("No pending invites")}
        </Text>
      )}
    </>
  )

  const showTabs = challenge.isCreator && pendingInvitees.length > 0

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        showCloseButton
        ariaTitle={t("B3MO Quest Leaderboard")}
        modalBodyProps={{ maxH: "70vh", overflowY: "auto" }}>
        <VStack gap={4} align="stretch">
          <Heading size="lg" textAlign="center">
            {challenge.title ?? t("B3MO Quest Leaderboard")}
          </Heading>

          {showTabs ? (
            <Tabs.Root defaultValue="joined" variant="line" fitted>
              <Tabs.List>
                <Tabs.Trigger value="joined">
                  <Icon as={Group} boxSize="4" />
                  {t("Joined")} {`(${humanNumber(totalCount)})`}
                </Tabs.Trigger>
                <Tabs.Trigger value="pending">
                  <Icon as={SendDiagonal} boxSize="4" />
                  {t("Pending")} {`(${pendingInvitees.length})`}
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="joined">
                <VStack gap={4} align="stretch">
                  {participantsContent}
                </VStack>
              </Tabs.Content>
              <Tabs.Content value="pending">
                <VStack gap={4} align="stretch">
                  {pendingContent}
                </VStack>
              </Tabs.Content>
            </Tabs.Root>
          ) : (
            participantsContent
          )}
        </VStack>
      </BaseModal>

      <ChallengeUserActionsModal
        onClose={() => setSelectedParticipant(null)}
        challenge={challenge}
        participant={selectedParticipant}
      />
    </>
  )
}
