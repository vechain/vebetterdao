"use client"

import { useB3trTokenDetails } from "@/api"
import { Box, Heading, StackDivider, Text, VStack } from "@chakra-ui/react"
import { BalanceCard, MintNewB3trCard, TokenDetailsCard } from "@/components"
import { useWallet } from "@vechain/dapp-kit-react"

export default function Home() {
  const { account } = useWallet()
  const tokenDetailsQueryResult = useB3trTokenDetails()

  return (
    <VStack spacing={4} divider={<StackDivider />}>
      <Box>
        <Heading as="h1" size="2xl">
          Welcome to the B3TR demo
        </Heading>
        <Text>Use the navigation bar on the left to navigate to the different pages.</Text>
      </Box>
      <TokenDetailsCard tokenDetailsQueryResult={tokenDetailsQueryResult} />
      <BalanceCard address={account ?? undefined} tokenDetailsQueryResult={tokenDetailsQueryResult} />
      <MintNewB3trCard />
    </VStack>
  )
}
