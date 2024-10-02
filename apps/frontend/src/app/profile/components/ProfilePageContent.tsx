import { VStack, HStack, Button } from "@chakra-ui/react"
import { ProfileHeader } from "./ProfileHeader/ProfileHeader"
import { useMemo, useState } from "react"
import { ProfileBetterActions } from "./ProfileBetterActions"
import { useTranslation } from "react-i18next"
import { ProfileBalance } from "./ProfileBalance"
import { ProfileGovernance } from "./ProfileGovernance"

enum Tab {
  Balance = "balance",
  BetterActions = "better-actions",
  Governance = "governance",
}

export const ProfilePageContent = () => {
  const { t } = useTranslation()
  const [selectedTab, setSelectedTab] = useState<Tab>(Tab.Balance)

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

  return (
    <VStack gap={6} align="stretch" w="full" maxW={"container.md"} mx="auto">
      <ProfileHeader />
      <HStack>
        <Button
          variant={"primaryGhost"}
          borderBottom={selectedTab === Tab.Balance ? "2px solid #004CFC" : "none"}
          rounded="none"
          onClick={() => setSelectedTab(Tab.Balance)}>
          {t("Balance")}
        </Button>
        <Button
          variant={"primaryGhost"}
          borderBottom={selectedTab === Tab.BetterActions ? "2px solid #004CFC" : "none"}
          rounded="none"
          onClick={() => setSelectedTab(Tab.BetterActions)}>
          {t("Better Actions")}
        </Button>
        <Button
          variant={"primaryGhost"}
          borderBottom={selectedTab === Tab.Governance ? "2px solid #004CFC" : "none"}
          rounded="none"
          onClick={() => setSelectedTab(Tab.Governance)}>
          {t("Governance")}
        </Button>
      </HStack>
      {selectedTabContent}
    </VStack>
  )
}
