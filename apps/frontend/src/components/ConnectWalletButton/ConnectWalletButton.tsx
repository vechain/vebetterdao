import { Button, Skeleton } from "@chakra-ui/react"
import dynamic from "next/dynamic"

const WalletButton = dynamic(() => import("@vechain/vechain-kit").then(mod => mod.WalletButton), {
  ssr: false,
  loading: () => (
    <Skeleton rounded="full">
      <Button size="md">{"Connect wallet"}</Button>
    </Skeleton>
  ),
})

export const ConnectWalletButton = () => {
  return <WalletButton mobileVariant="iconDomainAndAssets" desktopVariant="iconDomainAndAssets" />
}
