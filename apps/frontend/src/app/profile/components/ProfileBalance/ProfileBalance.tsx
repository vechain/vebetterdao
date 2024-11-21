import { VStack } from "@chakra-ui/react"
import { UserTransactions } from "./components/UserTransactions"
import { SwapB3trVot3 } from "@/components/GmNFTAndNodeCard/components/SwapB3trVot3"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/dapp-kit-react"

type Props = {
  address: string
}
export const ProfileBalance = ({ address }: Props) => {
  const { account } = useWallet()
  const isConnectedUser = compareAddresses(account ?? "", address)
  return (
    <VStack align={"stretch"} gap={4}>
      <SwapB3trVot3
        address={address}
        isConnectedUser={isConnectedUser}
        containerProps={{
          w: "full",
          align: "stretch",
          gap: "24px",
          bg: "#004CFC",
          rounded: "xl",
          color: "white",
          position: "relative",
          p: 4,
          overflow: "hidden",
          bgImage: "url('/images/cloud-background.png')",
          bgSize: "cover",
          bgPosition: "center",
          bgRepeat: "no-repeat",
        }}
      />
      <UserTransactions address={address} isConnectedUser={isConnectedUser} />
    </VStack>
  )
}
