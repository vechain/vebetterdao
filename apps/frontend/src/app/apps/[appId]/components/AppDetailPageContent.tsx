import { Stack, VStack } from "@chakra-ui/react"
import { AppCreationSteps, XAppsSteps } from "./AppCreationSteps/AppCreationSteps"
import { AppDetailOverview } from "./AppDetailOverview"
import { AppDetailsSidebar } from "./AppDetailSidebar"
import { AppEndorsementInfoCard } from "./AppEndorsementInfoCard/AppEndorsementInfoCard"
import { AppInfoProgressCard } from "./AppInfoProgressCard/AppInfoProgressCard"
import { AppScreenshots } from "./AppScreenshots"
import { AppTeam } from "./AppTeam/AppTeam"
import { AppTweets } from "./AppTweets"

export const AppDetailPageContent = () => {
  //TODO: Replace mock data with real data
  const mockTeamMembers = [{ address: "0X123", role: "Member" }]
  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <AppDetailOverview />
      <Stack w="full" spacing={8} flexDirection={["column-reverse", "row"]} align={["stretch", "flex-start"]}>
        <VStack align="stretch" gap={8} flex={3.5} minW={0}>
          <AppCreationSteps currentStep={XAppsSteps.ENDORSEMENT} />
          <AppScreenshots />
          <AppTweets />
        </VStack>
        <VStack align="stretch" gap={8} flex={1.5} minW={0}>
          <AppEndorsementInfoCard currentScore={0} endorsementThreshold={100} />
          <AppInfoProgressCard />
          <AppTeam teamMembers={mockTeamMembers} />
        </VStack>
        <AppDetailsSidebar />
      </Stack>
    </VStack>
  )
}
