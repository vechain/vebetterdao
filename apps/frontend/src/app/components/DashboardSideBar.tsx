import { Spinner, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import dynamic from "next/dynamic"

import { ManagedAppsCard } from "../../components/ManagedAppsCard/ManagedAppsCard"
import { useBreakpoints } from "../../hooks/useBreakpoints"
import { UserTransactions } from "../profile/components/ProfileBalance/components/UserTransactions"

import { CantVoteCard } from "./CantVoteCard/CantVoteCard"

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
    <VStack gap={4}>
      {isMobile && <CantVoteCard />}
      <ManagedAppsCard />
      <UserTransactions address={account?.address ?? ""} />
      <Leaderboard />
    </VStack>
  )
}
