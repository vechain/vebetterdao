import { VStack, HStack, Button, Box } from "@chakra-ui/react"
import { ProfileHeader } from "./ProfileHeader/ProfileHeader"
import { useMemo, useCallback, memo, useState, useEffect } from "react"
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

interface TabContentProps {
  tab: Tab
  address: string
}

const TabContent = memo(function TabContent({ tab, address }: TabContentProps) {
  switch (tab) {
    case Tab.Balance:
      return <ProfileBalance address={address} />
    case Tab.BetterActions:
      return <ProfileBetterActions address={address} />
    case Tab.Governance:
      return <ProfileGovernance address={address} />
    case Tab.LinkedAccounts:
      return <ProfileLinkedAcounts address={address} />
    case Tab.GM:
      return <ProfileGMLevel address={address} />
    case Tab.Nodes:
      return <ProfileNodes address={address} />
    default:
      return null
  }
})

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

  // Get the initial tab from the URL
  const getInitialTab = useCallback(() => {
    const tabFromURL = searchParams.get("tab")
    const isValidTab = Object.values(Tab).includes(tabFromURL as Tab)
    if (tabFromURL && isValidTab) {
      return tabFromURL as Tab
    }
    return Tab.Balance
  }, [searchParams])
  const [activeTab, setActiveTab] = useState(getInitialTab)

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
      setActiveTab(tab)
      trackTabChange(tab)
    },
    [updateURLWithTab],
  )

  // Go back to the home page
  const onGoBack = useCallback(() => {
    router.push("/")
  }, [router])

  return (
    <VStack gap={6} align="stretch" w="full" maxW={"container.md"} mx="auto">
      {!isConnectedUser && (
        <Button
          variant={"link"}
          colorScheme="primary"
          onClick={onGoBack}
          leftIcon={<FaAngleLeft />}
          size="sm"
          alignSelf={"flex-start"}>
          {t("Go back")}
        </Button>
      )}
      <ProfileHeader address={parsedAddress} />
      <Box
        w="full"
        overflowX="auto"
        whiteSpace="nowrap"
        css={{
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}>
        <HStack spacing={4} minWidth="max-content" justifyContent="flex-start" flexWrap="nowrap">
          {tabs.map(({ tab, label }) => (
            <Button
              key={tab}
              variant="primaryGhost"
              borderBottom={activeTab === tab ? "2px solid #004CFC" : "none"}
              rounded="none"
              fontSize={["xs", "xs", "md"]}
              onClick={() => handleTabChange(tab)}>
              {label}
            </Button>
          ))}
        </HStack>
      </Box>

      <TabContent tab={activeTab} address={parsedAddress} />
    </VStack>
  )
}
