import { VStack, HStack, Button } from "@chakra-ui/react"
import { ProfileHeader } from "./ProfileHeader/ProfileHeader"
import { useState } from "react"
import { ProfileBetterActions } from "./ProfileBetterActions"
import { useTranslation } from "react-i18next"
import { ProfileBalance } from "./ProfileBalance"

export const ProfilePageContent = () => {
  const { t } = useTranslation()
  const [selectedTab, setSelectedTab] = useState<"balance" | "better-actions">("balance")

  const selectedTabContent = selectedTab === "balance" ? <ProfileBalance /> : <ProfileBetterActions />

  return (
    <VStack gap={6} align="stretch" w="full" maxW={"container.md"} mx="auto">
      <ProfileHeader />
      <HStack>
        <Button
          variant={"primaryGhost"}
          borderBottom={selectedTab === "balance" ? "2px solid #004CFC" : "none"}
          rounded="none"
          onClick={() => setSelectedTab("balance")}>
          {t("Balance")}
        </Button>
        <Button
          variant={"primaryGhost"}
          borderBottom={selectedTab === "better-actions" ? "2px solid #004CFC" : "none"}
          rounded="none"
          onClick={() => setSelectedTab("better-actions")}>
          {t("Better Actions")}
        </Button>
      </HStack>
      {selectedTabContent}
    </VStack>
  )
}
