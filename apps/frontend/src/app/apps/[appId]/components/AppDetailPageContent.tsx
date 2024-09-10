import { useIsAppAdmin, useIsAppModerator } from "@/api"
import { Hide, Stack, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useCurrentAppInfo } from "../hooks/useCurrentAppInfo"
import { AppCreationSteps } from "./AppCreationSteps/AppCreationSteps"
import { AppDetailOverview } from "./AppDetailOverview"
import { AppDetailsSidebar } from "./AppDetailSidebar"
import { AppScreenshots } from "./AppScreenshots"
import { AppTweets } from "./AppTweets"

export const AppDetailPageContent = () => {
  const { app } = useCurrentAppInfo()
  const { account } = useWallet()
  const { data: isAppModerator } = useIsAppModerator(app?.id ?? "", account ?? "")
  const { data: isAppAdmin } = useIsAppAdmin(app?.id ?? "", account ?? "")

  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <AppDetailOverview />
      <Stack w="full" spacing={8} flexDirection={["column", "column", "column", "row"]} align="stretch">
        <Stack direction="column" gap={8} flex={3.5} minW={0} w="full" maxW={"100vw"}>
          {isAppModerator || isAppAdmin ? <AppCreationSteps /> : <Hide />}
          <AppScreenshots />
          <AppTweets />
        </Stack>
        <AppDetailsSidebar />
      </Stack>
    </VStack>
  )
}
