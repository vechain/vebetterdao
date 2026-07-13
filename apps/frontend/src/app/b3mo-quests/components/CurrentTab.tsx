import { Button, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuCompass } from "react-icons/lu"

import { selectNextChallengeStatus } from "@/api/challenges/nextChallengeStatus"
import { ChallengeKind, ChallengeView } from "@/api/challenges/types"
import {
  useNeededActionsSection,
  useOpenToJoinSection,
  useUserChallengesSection,
  useWhatOthersAreDoingSection,
} from "@/api/challenges/useChallengeSections"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { NextChallengeStatusCard } from "@/app/b3mo-quests/shared/NextChallengeStatusCard"
import { EmptyStateCard } from "@/components/EmptyStateCard"

import { CreateChallengeModal } from "./CreateChallengeModal"
import { SectionCarousel } from "./SectionCarousel"

interface CurrentTabProps {
  viewerAddress?: string
}

export const CurrentTab = ({ viewerAddress }: CurrentTabProps) => {
  const { t } = useTranslation()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const neededActions = useNeededActionsSection(viewerAddress)
  const userChallenges = useUserChallengesSection(viewerAddress)
  const openToJoin = useOpenToJoinSection(viewerAddress)
  const whatOthers = useWhatOthersAreDoingSection(viewerAddress)

  const nextMove = useMemo(
    () => selectNextChallengeStatus([...neededActions.items, ...userChallenges.items]),
    [neededActions.items, userChallenges.items],
  )

  // Dedupe across sections in render order: a challenge matching multiple
  // sections is kept only in the first (highest-priority) one.
  const deduped = useMemo(() => {
    const seen = new Set<number>(nextMove ? [nextMove.challenge.challengeId] : [])
    const take = (items: ChallengeView[]) =>
      items.filter(v => {
        if (seen.has(v.challengeId)) return false
        seen.add(v.challengeId)
        return true
      })
    return {
      needed: take(neededActions.items),
      user: take(userChallenges.items),
      open: take(openToJoin.items),
      others: take(whatOthers.items),
    }
  }, [neededActions.items, userChallenges.items, openToJoin.items, whatOthers.items, nextMove])

  const anyLoading = neededActions.isLoading || userChallenges.isLoading || openToJoin.isLoading || whatOthers.isLoading
  const noItems =
    !anyLoading &&
    neededActions.items.length === 0 &&
    userChallenges.items.length === 0 &&
    openToJoin.items.length === 0 &&
    whatOthers.items.length === 0
  const noPublicDiscovery =
    !openToJoin.isLoading && !whatOthers.isLoading && openToJoin.items.length === 0 && whatOthers.items.length === 0

  if (noItems) {
    return (
      <EmptyStateCard
        icon={<LuCompass />}
        title={t("No B3MO quests to show")}
        description={t("There are no active B3MO quests right now. Check back later or create one.")}
        actionNode={
          viewerAddress ? (
            <CreateChallengeModal defaultKind={ChallengeKind.Stake} currentRound={Number(currentRoundId ?? 0)}>
              <Button variant="primary" size="sm" minH="11" data-cy="challenge-someone-empty">
                {t("Challenge someone")}
              </Button>
            </CreateChallengeModal>
          ) : undefined
        }
      />
    )
  }

  return (
    <VStack align="stretch" gap="8" w="full">
      {viewerAddress && (
        <NextChallengeStatusCard
          status={nextMove}
          isLoading={neededActions.isLoading || userChallenges.isLoading}
          title={t("Your next move")}
        />
      )}
      {viewerAddress && <SectionCarousel title={t("Action needed")} section={neededActions} items={deduped.needed} />}
      {viewerAddress && <SectionCarousel title={t("Your B3MO Quests")} section={userChallenges} items={deduped.user} />}
      <SectionCarousel title={t("Open to Join")} section={openToJoin} items={deduped.open} />
      <SectionCarousel title={t("Live Quests You Missed")} section={whatOthers} items={deduped.others} />
      {noPublicDiscovery && (
        <EmptyStateCard
          rootProps={{ py: "10" }}
          icon={<LuCompass />}
          title={t("No public B3MO Quests right now")}
          description={t("Start a duel while you wait for the next public Quest.")}
          actionNode={
            <CreateChallengeModal defaultKind={ChallengeKind.Stake} currentRound={Number(currentRoundId ?? 0)}>
              <Button variant="secondary" size="sm" minH="11" data-cy="challenge-someone-discovery-empty">
                {t("Challenge someone")}
              </Button>
            </CreateChallengeModal>
          }
        />
      )}
    </VStack>
  )
}
