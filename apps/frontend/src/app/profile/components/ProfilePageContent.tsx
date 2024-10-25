import { VStack, HStack, Button } from "@chakra-ui/react"
import { ProfileHeader } from "./ProfileHeader/ProfileHeader"
import { useMemo, useEffect } from "react"
import { ProfileBetterActions } from "./ProfileBetterActions"
import { useTranslation } from "react-i18next"
import { ProfileBalance } from "./ProfileBalance"
import { ProfileGovernance } from "./ProfileGovernance"
import { useRouter, useSearchParams } from "next/navigation"
import { ProfileLinkedAcounts } from "./ProfileLinkedAcounts"
import { AnalyticsUtils } from "@/utils"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "@/constants"
import { useWallet } from "@vechain/dapp-kit-react"

enum Tab {
  Balance = "balance",
  BetterActions = "better-actions",
  Governance = "governance",
  LinkedAccounts = "linked-accounts",
}

type Props = {
  address?: string
}
export const ProfilePageContent = ({ address }: Props) => {
  const { account } = useWallet()

  const parsedAddress = address ?? account ?? ""
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedTab = useMemo(() => {
    const tabParam = searchParams.get("tab")
    switch (tabParam) {
      case Tab.BetterActions:
        return Tab.BetterActions
      case Tab.Governance:
        return Tab.Governance
      case Tab.LinkedAccounts:
        return Tab.LinkedAccounts
      default:
        return Tab.Balance
    }
  }, [searchParams])

  const selectedTabContent = useMemo(() => {
    switch (selectedTab) {
      case Tab.Balance:
        return <ProfileBalance address={parsedAddress} />
      case Tab.BetterActions:
        return <ProfileBetterActions address={parsedAddress} />
      case Tab.Governance:
        return <ProfileGovernance address={parsedAddress} />
      case Tab.LinkedAccounts:
        return <ProfileLinkedAcounts address={parsedAddress} />
      default:
        return null
    }
  }, [selectedTab, parsedAddress])

  useEffect(() => {
    if (!parsedAddress) router.push("/")
  }, [parsedAddress, router])

  const handleTabChange = (tab: Tab) => {
    router.push(`?tab=${tab}`)

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
      default:
        break
    }
  }

  const tabs = useMemo(
    () => [
      { tab: Tab.Balance, label: t("Balance") },
      { tab: Tab.BetterActions, label: t("Better Actions") },
      { tab: Tab.Governance, label: t("Governance") },
      { tab: Tab.LinkedAccounts, label: t("Linked Accounts") },
    ],
    [t],
  )

  if (!parsedAddress) return <></>

  return (
    <VStack gap={6} align="stretch" w="full" maxW={"container.md"} mx="auto">
      <ProfileHeader address={parsedAddress} />
      <HStack justify="space-between">
        {tabs.map(({ tab, label }) => (
          <Button
            key={tab}
            variant={"primaryGhost"}
            borderBottom={selectedTab === tab ? "2px solid #004CFC" : "none"}
            rounded="none"
            fontSize={["xs", "xs", "md"]}
            onClick={() => handleTabChange(tab)}>
            {label}
          </Button>
        ))}
      </HStack>
      {selectedTabContent}
    </VStack>
  )
}
