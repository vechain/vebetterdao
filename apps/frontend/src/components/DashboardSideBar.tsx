import { VStack } from "@chakra-ui/react"
import { BalanceCard } from "./BalanceCard"
import { GmNFT } from "./GmNFT"
import { VoterRewards } from "./VoterRewards"
import { useWallet } from "@vechain/dapp-kit-react"
import { WalletNotConnectedOverlay } from "./WalletNotConnectedOverlay"
import { LowOnVthoCard } from "./Banners"

export const DashboardSideBar = () => {
  const { account } = useWallet()
  return (
    <VStack spacing={4} flex={2.5} position="relative">
      {!account && <WalletNotConnectedOverlay description="Connect your wallet to check your balance" />}
      <BalanceCard />
      <LowOnVthoCard />
      <VoterRewards />
      <GmNFT />
    </VStack>
  )
}
