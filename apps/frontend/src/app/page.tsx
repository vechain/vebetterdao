"use client"

import { useB3trTokenDetails } from "@/api"
import { Box, Heading, Stack, StackDivider, Text, VStack } from "@chakra-ui/react"
import { BalanceCard, MintNewB3trCard, TokenDetailsCard } from "@/components"
import { useWallet } from "@vechain/dapp-kit-react"

export default function Home() {
  const { account } = useWallet()
  const tokenDetailsQueryResult = useB3trTokenDetails()

  return (
    <VStack spacing={4} divider={<StackDivider />} w="full">
      <TokenDetailsCard tokenDetailsQueryResult={tokenDetailsQueryResult} />
      <BalanceCard address={account ?? undefined} tokenDetailsQueryResult={tokenDetailsQueryResult} />
      <MintNewB3trCard />
    </VStack>
  )
}
