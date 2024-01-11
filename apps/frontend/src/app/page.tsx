"use client"

import { useB3trBalance, useB3trTokenDetails, useVot3Balance, useVot3TokenDetails } from "@/api"
import { Box, Stack, StackDivider, VStack } from "@chakra-ui/react"
import {
  BalanceCard,
  MintB3trButton,
  RedeemB3trButton,
  SwapB3trButton,
  TvlBreakdownPieChart,
  CirculatingSupplyPieChart,
} from "@/components"
import { useWallet } from "@vechain/dapp-kit-react"

export default function Home() {
  const { account } = useWallet()

  const b3trTokenDetailsQueryResult = useB3trTokenDetails()
  const b3trBalanceQueryResult = useB3trBalance(account ?? undefined)

  const vot3TokenDetailsQueryResult = useVot3TokenDetails()
  const vot3BalanceQueryResult = useVot3Balance(account ?? undefined)

  return (
    <VStack spacing={4} divider={<StackDivider />} w="full">
      <Stack
        w="full"
        direction={["column", "column", "row"]}
        justifyContent="stretch"
        alignItems={"stretch"}
        divider={<StackDivider />}
        spacing={4}>
        <Box w={["100%", "100%", "50%"]}>
          <CirculatingSupplyPieChart />
        </Box>
        <Box w={["100%", "100%", "50%"]}>
          <TvlBreakdownPieChart />
        </Box>
      </Stack>
      <Stack direction={["column", "column", "row"]} spacing={4} w="full" divider={<StackDivider />}>
        <VStack spacing={4} w="full">
          <BalanceCard
            balanceQueryResult={b3trBalanceQueryResult}
            tokenDetailsQueryResult={b3trTokenDetailsQueryResult}
            componentUpperRight={<MintB3trButton />}
            componentLowerRight={<SwapB3trButton />}
          />
        </VStack>
        <VStack spacing={4} w="full">
          <BalanceCard
            balanceQueryResult={vot3BalanceQueryResult}
            tokenDetailsQueryResult={vot3TokenDetailsQueryResult}
            componentLowerRight={<RedeemB3trButton />}
          />
        </VStack>
      </Stack>
    </VStack>
  )
}
