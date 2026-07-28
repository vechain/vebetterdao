import { VStack } from "@chakra-ui/react"
import { useWalletModal } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { ChallengeVisibility } from "@/api/challenges/types"
import { useOpenToJoinSection, useWhatOthersAreDoingSection } from "@/api/challenges/useChallengeSections"
import { useEndedChallenges } from "@/api/challenges/useEndedChallenges"

import { GuestConnectWalletBanner } from "./GuestConnectWalletBanner"
import { SectionCarousel } from "./SectionCarousel"

export const GuestActiveTab = () => {
  const { t } = useTranslation()
  const { open } = useWalletModal()
  const openToJoin = useOpenToJoinSection(undefined)
  const whatOthers = useWhatOthersAreDoingSection(undefined)
  const endedPublic = useEndedChallenges(ChallengeVisibility.Public)
  const endedPrivate = useEndedChallenges(ChallengeVisibility.Private)
  return (
    <VStack align="stretch" gap="8" w="full" pt="5">
      <GuestConnectWalletBanner />
      <SectionCarousel title={t("Open to Join")} section={openToJoin} onCardJoinOverride={open} />
      <SectionCarousel title={t("Live Quests You Missed")} section={whatOthers} />
      <SectionCarousel title={t("Past Quests")} section={endedPublic} />
      <SectionCarousel title={t("Past Private Quests")} section={endedPrivate} />
    </VStack>
  )
}
