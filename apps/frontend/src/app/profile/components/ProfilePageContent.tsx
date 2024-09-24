import { VStack, HStack, Button } from "@chakra-ui/react"
import { ProfileHeader } from "./ProfileHeader/ProfileHeader"
import { useState } from "react"
import { ProfileBetterActions } from "./ProfileBetterActions"
import { ProfileBalance } from "./ProfileBalance"
import { useTranslation } from "react-i18next"

export const ProfilePageContent = () => {
  const { t } = useTranslation()
  const [selectedTab, setSelectedTab] = useState<"balance" | "better-actions">("balance")

  const selectedTabContent = selectedTab === "balance" ? <ProfileBalance /> : <ProfileBetterActions />

  return (
    <VStack gap={6} align="stretch">
      <ProfileHeader />
      <HStack>
        <Button variant="ghost" onClick={() => setSelectedTab("balance")} isActive={selectedTab === "balance"}>
          {t("Balance")}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setSelectedTab("better-actions")}
          isActive={selectedTab === "better-actions"}>
          {t("Better Actions")}
        </Button>
      </HStack>
      {selectedTabContent}
    </VStack>
  )
}
