import { VStack } from "@chakra-ui/react"
import { UserTransactions } from "./components/UserTransactions"
import { SwapB3trVot3 } from "@/components/GmNFTAndNodeCard/components/SwapB3trVot3"

type Props = {
  address: string
}
export const ProfileBalance = ({ address }: Props) => {
  return (
    <VStack align={"stretch"} gap={4}>
      <SwapB3trVot3
        address={address}
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
          bgImage: "url('/assets/backgrounds/cloud-background.webp')",
          bgSize: "cover",
          bgPosition: "center",
          bgRepeat: "no-repeat",
        }}
      />
      <UserTransactions address={address} />
    </VStack>
  )
}
