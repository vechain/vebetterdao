import { Show, Spinner, VStack } from "@chakra-ui/react"
import { GmNFT } from "../../components/GmNFT"
import { ManagedAppsCard } from "../../components/ManagedAppsCard"
import { YourBetterActionsCard } from "./YourBetterActionsCard"
import { TokensBalance } from "./TokensBalance"
import { SupplyBreakdownCard } from "./SupplyBreakdownCard"
import { CantVoteCard } from "./CantVoteCard/CantVoteCard"
import dynamic from "next/dynamic"

const Leaderboard = dynamic(() => import("./Leaderboard").then(mod => mod.Leaderboard), {
  ssr: false,
  loading: () => (
    <VStack w="full" spacing={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})

export const DashboardSideBar = () => {
  return (
    <VStack spacing={4} position="relative" pos={"sticky"} top={24} left={0}>
      <Show below="md">
        <TokensBalance showGoToBalance />
        <CantVoteCard />
      </Show>
      <YourBetterActionsCard />
      <Leaderboard />
      <GmNFT />
      <ManagedAppsCard />
      <SupplyBreakdownCard />
    </VStack>
  )
}
