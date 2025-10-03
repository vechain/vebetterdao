import { VStack, Icon, Text, Link, Tabs } from "@chakra-ui/react"
import { ProfileHeader } from "./ProfileHeader/ProfileHeader"
import { useMemo, useCallback, useEffect, useState } from "react"
import { ProfileBetterActions } from "./ProfileBetterActions"
import { useTranslation } from "react-i18next"
import { ProfileBalance } from "./ProfileBalance"
import { ProfileGovernance } from "./ProfileGovernance"
import { useRouter, useSearchParams } from "next/navigation"
import { ProfileLinkedAcounts } from "./ProfileLinkedAcounts"
import { AnalyticsUtils } from "@/utils"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "@/constants"
import { useWallet } from "@vechain/vechain-kit"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { FaAngleLeft } from "react-icons/fa6"
import { ProfileGMLevel } from "./ProfileGMLevel"
import { ProfileNodes } from "./ProfileNodes"
import NextLink from "next/link"

enum Tab {
  Balance = "balance",
  BetterActions = "better-actions",
  Governance = "governance",
  LinkedAccounts = "linked-accounts",
  GM = "gm",
  Nodes = "nodes",
}

interface ProfilePageContentProps {
  address?: string
}

export const ProfilePageContent = ({ address }: ProfilePageContentProps) => {
  const { account } = useWallet()
  const { t } = useTranslation()
  const router = useRouter()
  const [initialTab, setInitialTab] = useState<Tab | undefined>()

  const isConnectedUser = compareAddresses(account?.address ?? "", address ?? "")
  const parsedAddress = address ?? account?.address ?? ""
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!parsedAddress) {
      router.push("/error")
    }

    if (!initialTab) {
      // Get the initial tab from the URL
      const getInitialTab = () => {
        const tabFromURL = searchParams.get("tab")
        const isValidTab = Object.values(Tab).includes(tabFromURL as Tab)
        if (tabFromURL && isValidTab) {
          return tabFromURL as Tab
        }
        return Tab.Balance
      }

      const initialTab = getInitialTab()
      setInitialTab(initialTab)
    }
  }, [initialTab, parsedAddress, router, searchParams])

  const tabs = useMemo(
    () => [
      { tab: Tab.Balance, label: t("Balance") },
      { tab: Tab.BetterActions, label: t("Better Actions") },
      { tab: Tab.GM, label: t("GM Level") },
      { tab: Tab.Nodes, label: t("Nodes") },
      { tab: Tab.Governance, label: t("Governance") },
      { tab: Tab.LinkedAccounts, label: t("Linked Accounts") },
    ],
    [t],
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
        <Link asChild w="max-content" color="actions.secondary.text-lighter">
          <NextLink href="/">
            <Icon as={FaAngleLeft} boxSize={3} />
            <Text textStyle="sm" fontWeight="semibold">
              {t("Go back")}
            </Text>
          </NextLink>
        </Link>
      )}
      <ProfileHeader address={parsedAddress} />
      <Tabs.Root
        size="lg"
        defaultValue={Tab.Balance}
        lazyMount
        onValueChange={tab => handleTabChange(tab.value as Tab)}>
        <Tabs.List justifyContent="space-around" scrollbar="hidden" overflow="scroll">
          {tabs.map(({ tab, label }) => (
            <Tabs.Trigger key={tab} value={tab} flexShrink={0}>
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
        <Tabs.Content value={Tab.Governance}>
          <ProfileGovernance address={parsedAddress} />
        </Tabs.Content>
        <Tabs.Content value={Tab.LinkedAccounts}>
          <ProfileLinkedAcounts address={parsedAddress} />
        </Tabs.Content>
        <Tabs.Content value={Tab.GM}>
          <ProfileGMLevel address={parsedAddress} />
        </Tabs.Content>
        <Tabs.Content value={Tab.Nodes}>
          <ProfileNodes address={parsedAddress} />
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  )
}
