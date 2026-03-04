import { VStack, Icon, Text, Tabs, Button } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { FaAngleLeft } from "react-icons/fa6"

import { buttonClickActions, buttonClicked, ButtonClickProperties } from "../../../constants/AnalyticsEvents"
import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"

import { ProfileBalance } from "./ProfileBalance/ProfileBalance"
import { ProfileBetterActions } from "./ProfileBetterActions/ProfileBetterActions"
import { ProfileGMLevel } from "./ProfileGM/ProfileGMLevel"
import { ProfileGovernance } from "./ProfileGovernance/ProfileGovernance"
import { ProfileHeader } from "./ProfileHeader/ProfileHeader"
import { ProfileLinkedAcounts } from "./ProfileLinkedAcounts/ProfileLinkedAcounts"
import { ProfileNodes } from "./ProfileNodes/ProfileNodes"

enum Tab {
  Balance = "balance",
  BetterActions = "better-actions",
  GM = "gm",
  Nodes = "nodes",
  Governance = "governance",
  LinkedAccounts = "linked-accounts",
}
interface ProfilePageContentProps {
  address?: string
}
export const ProfilePageContent = ({ address }: ProfilePageContentProps) => {
  const { account } = useWallet()
  const { t } = useTranslation()
  const router = useRouter()
  const isConnectedUser = compareAddresses(account?.address ?? "", address ?? "")
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
    return Tab.Balance
  }, [searchParams])

  const tabs = useMemo(
    () =>
      [
        { tab: Tab.Balance, label: t("Balance") },
        { tab: Tab.BetterActions, label: t("Better Actions") },
        !isConnectedUser && { tab: Tab.GM, label: t("GM") },
        !isConnectedUser && { tab: Tab.Nodes, label: t("Nodes") },
        { tab: Tab.Governance, label: t("Governance") },
        { tab: Tab.LinkedAccounts, label: t("Linked Accounts") },
      ].filter((t): t is { tab: Tab; label: string } => Boolean(t)),
    [t, isConnectedUser],
  )

  const trackTabChange = (tab: Tab) => {
    switch (tab) {
      case Tab.Balance:
        AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.EXPLORE_BALANCE_FROM_PROFILE))
        break
      case Tab.BetterActions:
        AnalyticsUtils.trackEvent(
          buttonClicked,
          buttonClickActions(ButtonClickProperties.EXPLORE_BETTER_ACTIONS_FROM_PROFILE),
        )
        break
      case Tab.GM:
        AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.EXPLORE_GM_FROM_PROFILE))
        break
      case Tab.Nodes:
        AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.EXPLORE_NODES_FROM_PROFILE))
        break
      case Tab.Governance:
        AnalyticsUtils.trackEvent(
          buttonClicked,
          buttonClickActions(ButtonClickProperties.EXPLORE_GOVERNANCE_FROM_PROFILE),
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
      {!isConnectedUser && (
        <Button asChild w="max-content" variant="link">
          <NextLink href="/">
            <Icon as={FaAngleLeft} boxSize={3} />
            <Text color="inherit" textStyle="sm" fontWeight="semibold">
              {t("Go back")}
            </Text>
          </NextLink>
        </Button>
      )}
      <ProfileHeader address={parsedAddress} />
      <Tabs.Root
        variant="line"
        size="lg"
        defaultValue={getInitialTab()}
        lazyMount
        onValueChange={tab => handleTabChange(tab.value as Tab)}>
        <Tabs.List justifyContent="space-around" zIndex="0" scrollbar="hidden" overflowX="auto" overflowY="hidden">
          {tabs.map(({ tab, label }) => (
            <Tabs.Trigger key={tab} value={tab} flexShrink={0} zIndex="1">
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value={Tab.Balance}>
          <ProfileBalance address={parsedAddress} />
        </Tabs.Content>
        <Tabs.Content value={Tab.BetterActions}>
          <ProfileBetterActions address={parsedAddress} />
        </Tabs.Content>
        <Tabs.Content value={Tab.GM}>
          <ProfileGMLevel address={parsedAddress} />
        </Tabs.Content>
        <Tabs.Content value={Tab.Nodes}>
          <ProfileNodes address={parsedAddress} />
        </Tabs.Content>
        <Tabs.Content value={Tab.Governance}>
          <ProfileGovernance address={parsedAddress} />
        </Tabs.Content>
        <Tabs.Content value={Tab.LinkedAccounts}>
          <ProfileLinkedAcounts address={parsedAddress} />
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  )
}
