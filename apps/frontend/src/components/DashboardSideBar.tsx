import { VStack } from "@chakra-ui/react"
import { GmNFT } from "./GmNFT"
import { VoterRewards } from "./VoterRewards"
import { useWallet } from "@vechain/dapp-kit-react"
import { WalletNotConnectedOverlay } from "./WalletNotConnectedOverlay"
import { ManagedAppsCard } from "./ManagedAppsCard"

export const DashboardSideBar = () => {
  const { account } = useWallet()
  return (
    <VStack spacing={4} flex={2.5} position="relative" pos={"sticky"} top={24} left={0}>
      {!account && <WalletNotConnectedOverlay description="Connect your wallet to check your balance" />}
      <VoterRewards />
      <GmNFT />
      <ManagedAppsCard />
    </VStack>
  )
}
