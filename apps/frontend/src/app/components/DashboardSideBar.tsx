import { Show, VStack } from "@chakra-ui/react"
import { GmNFT } from "../../components/GmNFT"
import { VoterRewards } from "../../components/VoterRewards"
import { useWallet } from "@vechain/dapp-kit-react"
import { WalletNotConnectedOverlay } from "../../components/WalletNotConnectedOverlay"
import { ManagedAppsCard } from "../../components/ManagedAppsCard"
import { YourBetterActionsCard } from "./YourBetterActionsCard"
import { TokensBalance } from "./TokensBalance"

export const DashboardSideBar = () => {
  const { account } = useWallet()
  return (
    <VStack spacing={4} flex={2.5} position="relative" pos={"sticky"} top={24} left={0}>
      {!account && <WalletNotConnectedOverlay description="Connect your wallet to check your balance" />}
      <Show below="md">
        <TokensBalance showGoToBalance />
      </Show>
      <YourBetterActionsCard />
      <VoterRewards />
      <GmNFT />
      <ManagedAppsCard />
    </VStack>
  )
}
