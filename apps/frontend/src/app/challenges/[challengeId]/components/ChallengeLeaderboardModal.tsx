import { Heading, Icon, Separator, Skeleton, Tabs, Text, VStack } from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useWallet } from "@vechain/vechain-kit"
import { Group, SendDiagonal } from "iconoir-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { type ChallengeDetail, ChallengeStatus } from "@/api/challenges/types"
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
}

const SKELETON_COUNT = 5

export const ChallengeLeaderboardModal = ({
  isOpen,
  onClose,
  challenge,
  leaderboard,
  isLoading,
  pendingInvitees,
}: ChallengeLeaderboardModalProps) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const [selectedParticipant, setSelectedParticipant] = useState<ChallengeUserActionsParticipant | null>(null)

  const isPending = challenge.status === ChallengeStatus.Pending
  const showTrophy = !isPending

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
              showTrophy={showTrophy}
              hideScore={isPending}
              isYou={AddressUtils.compareAddresses(ranking.address, account?.address ?? "")}
              onClick={() => setSelectedParticipant(ranking)}
            />
          ))}

      {!isLoading && viewerIndex === -1 && account?.address && (
        <>
          <Separator w="full" h={1} color="border.secondary" />
          <ChallengeActionsRow
            position={0}
            address={account.address}
            score={0}
            isYou
            showTrophy={showTrophy}
            hideScore={isPending}
            onClick={() => setSelectedParticipant({ address: account.address!, position: 0, score: 0 })}
          />
        </>
      )}

      {!isLoading && rankings.length === 0 && (
        <Text textStyle="sm" color="text.subtle" textAlign="center" py={4}>
          {t("No participant joined this quest yet")}
        </Text>
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
        ariaTitle={t("Quest Leaderboard")}
        modalBodyProps={{ maxH: "70vh", overflowY: "auto" }}>
        <VStack gap={4} align="stretch">
          <Heading size="lg" textAlign="center">
            {challenge.title ?? t("Quest Leaderboard")}
          </Heading>

          {showTabs ? (
            <Tabs.Root defaultValue="joined" variant="line" fitted>
              <Tabs.List>
                <Tabs.Trigger value="joined">
                  <Icon as={Group} boxSize="4" />
                  {t("Joined")} {`(${rankings.length})`}
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
