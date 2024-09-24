import { VStack } from "@chakra-ui/react"
import { BalanceCard } from "./BalanceCard"
import { GmNFT } from "./GmNFT"
import { VoterRewards } from "./VoterRewards"
import { useWallet } from "@vechain/dapp-kit-react"
import { WalletNotConnectedOverlay } from "./WalletNotConnectedOverlay"
import { ManagedAppsCard } from "./ManagedAppsCard"
import { ActivityCalendar } from "./ActivityCalendar/ActivityCalendar"

export const DashboardSideBar = () => {
  const { account } = useWallet()
  return (
    <VStack spacing={4} flex={2.5} position="relative" pos={"sticky"} top={24} left={0}>
      <ActivityCalendar />
      {!account && <WalletNotConnectedOverlay description="Connect your wallet to check your balance" />}
      <BalanceCard />
      <VoterRewards />
      <GmNFT />
      <ManagedAppsCard />
    </VStack>
  )
}
