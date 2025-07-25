import { Show, Spinner, VStack } from "@chakra-ui/react"
import { ManagedAppsCard } from "../../components/ManagedAppsCard"
import { YourBetterActionsCard } from "./YourBetterActionsCard"
import { SupplyBreakdownCard } from "./SupplyBreakdownCard"
import { CantVoteCard } from "./CantVoteCard/CantVoteCard"
import { useWallet } from "@vechain/vechain-kit"
import dynamic from "next/dynamic"
import { useBreakpoints } from "@/hooks"

const Leaderboard = dynamic(() => import("../../components/Leaderboard/Leaderboard").then(mod => mod.Leaderboard), {
  ssr: false,
  loading: () => (
    <VStack w="full" gap={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})

export const DashboardSideBar = () => {
  const { account } = useWallet()
  const { isMobile } = useBreakpoints()
  return (
    <VStack gap={4} position="relative" pos={"sticky"} top={24} left={0}>
      <Show when={isMobile}>
        <CantVoteCard />
      </Show>
      <YourBetterActionsCard address={account?.address ?? ""} />
      <Leaderboard />
      <ManagedAppsCard />
      <SupplyBreakdownCard />
    </VStack>
  )
}
