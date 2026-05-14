import { VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"

import { Leaderboard } from "@/components/Leaderboard/Leaderboard"
import { NotConnectedWallet } from "@/components/NotConnectedWallet"

import { ManagedAppsCard } from "../../components/ManagedAppsCard/ManagedAppsCard"
import { useBreakpoints } from "../../hooks/useBreakpoints"

import { CantVoteCard } from "./CantVoteCard/CantVoteCard"
import { CitizenNavigatorCard } from "./CitizenNavigatorCard"
import { NavigatorDashboardCard } from "./NavigatorDashboardCard"
import { NavigatorDiscoveryCard } from "./NavigatorDiscoveryCard"
import { OnboardingCard } from "./OnboardingCard/OnboardingCard"
import { SupplyBreakdownCard } from "./SupplyBreakdownCard"
import { YourBetterActionsCard } from "./YourBetterActionsCard"

export const DashboardSideBar = () => {
  const { account } = useWallet()
  const { isMobile } = useBreakpoints()
  return (
    <VStack gap={4}>
      {!account?.address && <NotConnectedWallet />}
      {isMobile && <CantVoteCard />}
      {isMobile && <OnboardingCard />}
      <ManagedAppsCard />
      <NavigatorDashboardCard />
      <CitizenNavigatorCard />
      <YourBetterActionsCard address={account?.address ?? ""} />
      <Leaderboard />
      {isMobile && <NavigatorDiscoveryCard />}
      {isMobile && <SupplyBreakdownCard />}
    </VStack>
  )
}
