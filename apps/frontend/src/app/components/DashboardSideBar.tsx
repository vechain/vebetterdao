import { VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"

import { GmNFTAndNodeCard } from "@/components/GmNFTAndNodeCard/GmNFTAndNodeCard"

import { ManagedAppsCard } from "../../components/ManagedAppsCard/ManagedAppsCard"
import { useBreakpoints } from "../../hooks/useBreakpoints"

import { CantVoteCard } from "./CantVoteCard/CantVoteCard"
import { YourBetterActionsCard } from "./YourBetterActionsCard"

export const DashboardSideBar = () => {
  const { account } = useWallet()
  const { isMobile } = useBreakpoints()
  return (
    <VStack gap={4}>
      {isMobile && <CantVoteCard />}
      <ManagedAppsCard />
      <YourBetterActionsCard address={account?.address ?? ""} />
      <GmNFTAndNodeCard />
    </VStack>
  )
}
