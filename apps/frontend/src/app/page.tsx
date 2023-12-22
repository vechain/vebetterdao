"use client"

import { useB3trBalance, useB3trTokenDetails, useVot3Balance, useVot3TokenDetails } from "@/api"
import { Stack, StackDivider, VStack } from "@chakra-ui/react"
import { BalanceCard, MintNewB3trCard, TokenDetailsCard } from "@/components"
import { useWallet } from "@vechain/dapp-kit-react"

export default function Home() {
  const { account } = useWallet()

  const b3trTokenDetailsQueryResult = useB3trTokenDetails()
  const b3trBalanceQueryResult = useB3trBalance(account ?? undefined)

  const vot3TokenDetailsQueryResult = useVot3TokenDetails()
  const vot3BalanceQueryResult = useVot3Balance(account ?? undefined)

  return (
    <VStack spacing={4} divider={<StackDivider />} w="full">
      <Stack direction={["column", "column", "row"]} spacing={4} w="full" divider={<StackDivider />}>
        <VStack spacing={4} w="full">
          <TokenDetailsCard tokenDetailsQueryResult={b3trTokenDetailsQueryResult} />
          <BalanceCard
            balanceQueryResult={b3trBalanceQueryResult}
            tokenDetailsQueryResult={b3trTokenDetailsQueryResult}
          />
        </VStack>
        <VStack spacing={4} w="full">
          <TokenDetailsCard tokenDetailsQueryResult={vot3TokenDetailsQueryResult} />
          <BalanceCard
            balanceQueryResult={vot3BalanceQueryResult}
            tokenDetailsQueryResult={vot3TokenDetailsQueryResult}
          />
        </VStack>
      </Stack>
      <MintNewB3trCard />
    </VStack>
  )
}
