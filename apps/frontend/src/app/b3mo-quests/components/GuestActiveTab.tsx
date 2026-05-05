import { VStack } from "@chakra-ui/react"
import { useWalletModal } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { useOpenToJoinSection, useWhatOthersAreDoingSection } from "@/api/challenges/useChallengeSections"

import { GuestConnectWalletBanner } from "./GuestConnectWalletBanner"
import { SectionCarousel } from "./SectionCarousel"

export const GuestActiveTab = () => {
  const { t } = useTranslation()
  const { open } = useWalletModal()
  const openToJoin = useOpenToJoinSection(undefined)
  const whatOthers = useWhatOthersAreDoingSection(undefined)
  return (
    <VStack align="stretch" gap="8" w="full" pt="5">
      <GuestConnectWalletBanner />
      <SectionCarousel title={t("Open to Join")} section={openToJoin} onCardJoinOverride={open} />
      <SectionCarousel title={t("Live Quests You Missed")} section={whatOthers} />
    </VStack>
  )
}
