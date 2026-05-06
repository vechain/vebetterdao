import { VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"

import { GmNFTAndNodeCard } from "@/components/GmNFTAndNodeCard/GmNFTAndNodeCard"
import { Leaderboard } from "@/components/Leaderboard/Leaderboard"

import { ManagedAppsCard } from "../../components/ManagedAppsCard/ManagedAppsCard"
import { useBreakpoints } from "../../hooks/useBreakpoints"

import { CantVoteCard } from "./CantVoteCard/CantVoteCard"
import { CitizenNavigatorCard } from "./CitizenNavigatorCard"
import { NavigatorDashboardCard } from "./NavigatorDashboardCard"
import { NavigatorDiscoveryCard } from "./NavigatorDiscoveryCard"
import { SupplyBreakdownCard } from "./SupplyBreakdownCard"
import { YourBetterActionsCard } from "./YourBetterActionsCard"

export const DashboardSideBar = () => {
  const { account } = useWallet()
  const { isMobile } = useBreakpoints()
  return (
    <VStack gap={4}>
      {isMobile && <CantVoteCard />}
      <ManagedAppsCard />
      <NavigatorDashboardCard />
      <CitizenNavigatorCard />
      <GmNFTAndNodeCard />
      {isMobile && <NavigatorDiscoveryCard />}
      <YourBetterActionsCard address={account?.address ?? ""} />
      <Leaderboard />
      {isMobile && <SupplyBreakdownCard />}
    </VStack>
  )
}
