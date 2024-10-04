import { Show, VStack } from "@chakra-ui/react"
import { GmNFT } from "../../components/GmNFT"
import { ManagedAppsCard } from "../../components/ManagedAppsCard"
import { YourBetterActionsCard } from "./YourBetterActionsCard"
import { TokensBalance } from "./TokensBalance"
import { Leaderboard } from "./Leaderboard"
import { SupplyBreakdownCard } from "./SupplyBreakdownCard"

export const DashboardSideBar = () => {
  return (
    <VStack spacing={4} flex={2.5} position="relative" pos={"sticky"} top={24} left={0}>
      <Show below="md">
        <TokensBalance showGoToBalance />
      </Show>
      <YourBetterActionsCard />
      <Leaderboard />
      <GmNFT />
      <ManagedAppsCard />
      <SupplyBreakdownCard />
    </VStack>
  )
}
