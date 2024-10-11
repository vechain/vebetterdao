import { VStack, HStack, Button } from "@chakra-ui/react"
import { ProfileHeader } from "./ProfileHeader/ProfileHeader"
import { useMemo, useEffect } from "react"
import { ProfileBetterActions } from "./ProfileBetterActions"
import { useTranslation } from "react-i18next"
import { ProfileBalance } from "./ProfileBalance"
import { ProfileGovernance } from "./ProfileGovernance"
import { useRouter, useSearchParams } from "next/navigation"
import { useWallet } from "@vechain/dapp-kit-react"
import { ProfileLinkedAcounts } from "./ProfileLinkedAcounts"

enum Tab {
  Balance = "balance",
  BetterActions = "better-actions",
  Governance = "governance",
  LinkedAccounts = "linked-accounts",
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
      case Tab.LinkedAccounts:
        return Tab.LinkedAccounts
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
      case Tab.LinkedAccounts:
        return <ProfileLinkedAcounts />
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

  const tabs = useMemo(
    () => [
      { tab: Tab.Balance, label: t("Balance") },
      { tab: Tab.BetterActions, label: t("Better Actions") },
      { tab: Tab.Governance, label: t("Governance") },
      { tab: Tab.LinkedAccounts, label: t("Linked Accounts") },
    ],
    [t],
  )

  if (!account) return <></>

  return (
    <VStack gap={6} align="stretch" w="full" maxW={"container.md"} mx="auto">
      <ProfileHeader />
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
