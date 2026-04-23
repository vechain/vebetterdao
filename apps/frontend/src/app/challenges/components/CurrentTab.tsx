import { VStack } from "@chakra-ui/react"
import { UilCompass } from "@iconscout/react-unicons"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ChallengeView } from "@/api/challenges/types"
import {
  useNeededActionsSection,
  useOpenToJoinSection,
  useUserChallengesSection,
  useWhatOthersAreDoingSection,
} from "@/api/challenges/useChallengeSections"
import { EmptyState } from "@/components/ui/empty-state"

import { SectionCarousel } from "./SectionCarousel"

interface CurrentTabProps {
  viewerAddress?: string
}

export const CurrentTab = ({ viewerAddress }: CurrentTabProps) => {
  const { t } = useTranslation()
  const neededActions = useNeededActionsSection(viewerAddress)
  const userChallenges = useUserChallengesSection(viewerAddress)
  const openToJoin = useOpenToJoinSection(viewerAddress)
  const whatOthers = useWhatOthersAreDoingSection(viewerAddress)

  // Dedupe across sections in render order: a challenge matching multiple
  // sections is kept only in the first (highest-priority) one.
  const deduped = useMemo(() => {
    const seen = new Set<number>()
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
  }, [neededActions.items, userChallenges.items, openToJoin.items, whatOthers.items])

  const anyLoading = neededActions.isLoading || userChallenges.isLoading || openToJoin.isLoading || whatOthers.isLoading
  const noItems =
    !anyLoading &&
    neededActions.items.length === 0 &&
    userChallenges.items.length === 0 &&
    openToJoin.items.length === 0 &&
    whatOthers.items.length === 0

  if (noItems) {
    return (
      <EmptyState
        py="16"
        icon={<UilCompass />}
        title={t("No quests to show")}
        description={t("There are no active quests right now. Check back later or create one.")}
      />
    )
  }

  return (
    <VStack align="stretch" gap="8" w="full">
      {viewerAddress && <SectionCarousel title={t("Needed Action")} section={neededActions} items={deduped.needed} />}
      {viewerAddress && <SectionCarousel title={t("Your Challenges")} section={userChallenges} items={deduped.user} />}
      <SectionCarousel title={t("Open to Join")} section={openToJoin} items={deduped.open} />
      <SectionCarousel title={t("What Others Are Doing")} section={whatOthers} items={deduped.others} />
    </VStack>
  )
}
