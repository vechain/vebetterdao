import { VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuCompass } from "react-icons/lu"

import { ChallengeVisibility } from "@/api/challenges/types"
import { useEndedChallenges } from "@/api/challenges/useEndedChallenges"
import { EmptyStateCard } from "@/components/EmptyStateCard"

import { SectionCarousel } from "./SectionCarousel"

export const PastTab = () => {
  const { t } = useTranslation()
  const endedPublic = useEndedChallenges(ChallengeVisibility.Public)
  const endedPrivate = useEndedChallenges(ChallengeVisibility.Private)

  const isLoading = endedPublic.isLoading || endedPrivate.isLoading
  const isEmpty = !isLoading && endedPublic.items.length === 0 && endedPrivate.items.length === 0

  if (isEmpty) {
    return (
      <EmptyStateCard
        icon={<LuCompass />}
        title={t("No B3MO quests to show")}
        description={t("B3MO Quests show up here once they end")}
      />
    )
  }

  return (
    <VStack align="stretch" gap="8" w="full">
      <SectionCarousel title={t("Past Quests")} section={endedPublic} />
      <SectionCarousel title={t("Past Private Quests")} section={endedPrivate} />
    </VStack>
  )
}
