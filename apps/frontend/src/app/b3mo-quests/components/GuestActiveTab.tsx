import { VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useWhatOthersAreDoingSection } from "@/api/challenges/useChallengeSections"

import { ChallengesGrid } from "./ChallengesGrid"
import { GuestConnectWalletBanner } from "./GuestConnectWalletBanner"

export const GuestActiveTab = () => {
  const { t } = useTranslation()
  const section = useWhatOthersAreDoingSection(undefined)
  return (
    <VStack align="stretch" gap="6" w="full" pt="5">
      <GuestConnectWalletBanner />
      <ChallengesGrid
        items={section.items}
        section={section}
        emptyDescription={t("No active quests right now — check back soon.")}
      />
    </VStack>
  )
}
