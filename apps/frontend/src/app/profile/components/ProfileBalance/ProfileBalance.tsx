import { Card, VStack } from "@chakra-ui/react"

import { SwapB3trVot3 } from "@/components/GmNFTAndNodeCard/components/SwapB3trVot3"

import { UserTransactions } from "./components/UserTransactions"

type Props = {
  address: string
}
export const ProfileBalance = ({ address }: Props) => {
  return (
    <VStack align="stretch" gap="4">
      <Card.Root bg="banner.dashboard-tokens">
        <Card.Body>
          <SwapB3trVot3 address={address} />
        </Card.Body>
      </Card.Root>
      <UserTransactions address={address} />
    </VStack>
  )
}
