import { VStack, Tabs } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"

import { buttonClickActions, buttonClicked, ButtonClickProperties } from "../../../constants/AnalyticsEvents"
import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"

import { ProfileBetterActions } from "./ProfileBetterActions/ProfileBetterActions"
import { ProfileHeader } from "./ProfileHeader/ProfileHeader"
import { ProfileNFTs } from "./ProfileNFTs/ProfileNFTs"
import { ProfileSettings } from "./ProfileSettings/ProfileSettings"

enum Tab {
  BetterActions = "better-actions",
  NFTs = "nfts",
  Settings = "settings",
}
interface ProfilePageContentProps {
  address?: string
}
export const ProfilePageContent = ({ address }: ProfilePageContentProps) => {
  const { account } = useWallet()
  const { t } = useTranslation()
  const router = useRouter()
  const parsedAddress = address ?? account?.address ?? ""
  const searchParams = useSearchParams()
  useEffect(() => {
    if (!parsedAddress) {
      router.push("/error")
    }
  }, [parsedAddress, router])

  const getInitialTab = useCallback(() => {
    const tabFromURL = searchParams.get("tab")
    const isValidTab = Object.values(Tab).includes(tabFromURL as Tab)
    if (tabFromURL && isValidTab) {
      return tabFromURL as Tab
    }
    return Tab.BetterActions
  }, [searchParams])

  const tabs = useMemo(
    () => [
      { tab: Tab.BetterActions, label: t("Better Actions") },
      { tab: Tab.NFTs, label: t("NFTs") },
      { tab: Tab.Settings, label: t("Settings") },
    ],
    [t],
  )

  const trackTabChange = (tab: Tab) => {
    switch (tab) {
      case Tab.BetterActions:
        AnalyticsUtils.trackEvent(
          buttonClicked,
          buttonClickActions(ButtonClickProperties.EXPLORE_BETTER_ACTIONS_FROM_PROFILE),
        )
        break
    }
  }

  // Update the URL with the new tab
  const updateURLWithTab = useCallback(
    (tab: Tab): void => {
      // Guard against SSR
      if (typeof window === "undefined") {
        console.warn("Cannot update URL during server-side rendering")
        return
      }

      try {
        const params = new URLSearchParams(searchParams.toString())
        params.set("tab", tab)
        // Update URL without triggering a navigation that causes the page to flicker
        window.history.replaceState(null, "", `?${params.toString()}`)
      } catch (error) {
        console.error("Error updating URL with tab:", error)
      }
    },
    [searchParams],
  )

  const handleTabChange = useCallback(
    (tab: Tab) => {
      updateURLWithTab(tab)
      trackTabChange(tab)
    },
    [updateURLWithTab],
  )

  return (
    <VStack gap={6} align="stretch" w="full" maxW={"breakpoint-md"} mx="auto">
      <ProfileHeader address={parsedAddress} />
      <Tabs.Root
        variant="line"
        size="lg"
        defaultValue={getInitialTab()}
        lazyMount
        onValueChange={tab => handleTabChange(tab.value as Tab)}>
        <Tabs.List justifyContent="space-around" zIndex="0" scrollbar="hidden" overflowX="scroll">
          {tabs.map(({ tab, label }) => (
            <Tabs.Trigger key={tab} value={tab} flexShrink={0} zIndex="1">
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value={Tab.BetterActions}>
          <ProfileBetterActions address={parsedAddress} />
        </Tabs.Content>
        <Tabs.Content value={Tab.NFTs}>
          <ProfileNFTs address={parsedAddress} />
        </Tabs.Content>
        <Tabs.Content value={Tab.Settings}>
          <ProfileSettings address={parsedAddress} />
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  )
}
