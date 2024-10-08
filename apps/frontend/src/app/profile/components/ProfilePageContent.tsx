import { VStack, HStack, Button } from "@chakra-ui/react"
import { ProfileHeader } from "./ProfileHeader/ProfileHeader"
import { useMemo, useEffect } from "react"
import { ProfileBetterActions } from "./ProfileBetterActions"
import { useTranslation } from "react-i18next"
import { ProfileBalance } from "./ProfileBalance"
import { ProfileGovernance } from "./ProfileGovernance"
import { useRouter, useSearchParams } from "next/navigation"
import { useWallet } from "@vechain/dapp-kit-react"
import { AnalyticsUtils } from "@/utils"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "@/constants"

enum Tab {
  Balance = "balance",
  BetterActions = "better-actions",
  Governance = "governance",
}

export const ProfilePageContent = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const searchParams = useSearchParams()

  const selectedTab = useMemo(() => {
    const tabParam = searchParams.get("tab")
    switch (tabParam) {
      case Tab.BetterActions:
        return Tab.BetterActions
      case Tab.Governance:
        return Tab.Governance
      default:
        return Tab.Balance
    }
  }, [searchParams])

  const selectedTabContent = useMemo(() => {
    switch (selectedTab) {
      case Tab.Balance:
        return <ProfileBalance />
      case Tab.BetterActions:
        return <ProfileBetterActions />
      case Tab.Governance:
        return <ProfileGovernance />
      default:
        return null
    }
  }, [selectedTab])

  useEffect(() => {
    if (!account) router.back()
  }, [account, router])

  const handleTabChange = (tab: Tab) => {
    router.push(`?tab=${tab}`)
  }

  if (!account) return <></>

  return (
    <VStack gap={6} align="stretch" w="full" maxW={"container.md"} mx="auto">
      <ProfileHeader />
      <HStack justify="space-between">
        <Button
          variant={"primaryGhost"}
          borderBottom={selectedTab === Tab.Balance ? "2px solid #004CFC" : "none"}
          rounded="none"
          onClick={() => {
            handleTabChange(Tab.Balance)
            AnalyticsUtils.trackEvent(
              buttonClicked,
              buttonClickActions(ButtonClickProperties.EXPLORE_BALANCE_FROM_PROFILE),
            )
          }}>
          {t("Balance")}
        </Button>
        <Button
          variant={"primaryGhost"}
          borderBottom={selectedTab === Tab.BetterActions ? "2px solid #004CFC" : "none"}
          rounded="none"
          onClick={() => {
            handleTabChange(Tab.BetterActions)
            AnalyticsUtils.trackEvent(
              buttonClicked,
              buttonClickActions(ButtonClickProperties.EXPLORE_BETTER_ACTIONS_FROM_PROFILE),
            )
          }}>
          {t("Better Actions")}
        </Button>
        <Button
          variant={"primaryGhost"}
          borderBottom={selectedTab === Tab.Governance ? "2px solid #004CFC" : "none"}
          rounded="none"
          onClick={() => {
            handleTabChange(Tab.Governance)
            AnalyticsUtils.trackEvent(
              buttonClicked,
              buttonClickActions(ButtonClickProperties.EXPLORE_GOVERNANCE_FROM_PROFILE),
            )
          }}>
          {t("Governance")}
        </Button>
      </HStack>
      {selectedTabContent}
    </VStack>
  )
}
