"use client"

import { VStack, Grid, GridItem } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { redirect, usePathname } from "next/navigation"

import { CountdownBox } from "./CountdownBox"
import { PotentialRewardBox } from "./PotentialRewardBox"
import { VotingPowerBox } from "./VotingPowerBox"

export const AllocationLayoutHeader = () => {
  const { account } = useWallet()
  const pathname = usePathname()

  if (!account?.address && pathname === "/allocations") redirect("/allocations/round")

  return (
    <VStack alignItems="stretch" gap="2" w="full">
      <Grid templateColumns={{ base: "repeat(2,1fr)", md: "repeat(3,1fr)" }} gap={{ base: "2", md: "6" }}>
        <GridItem colSpan={{ base: 2, md: 1 }} w="full">
          <VotingPowerBox />
        </GridItem>
        <GridItem asChild>
          <PotentialRewardBox />
        </GridItem>
        <GridItem asChild>
          <CountdownBox />
        </GridItem>
      </Grid>
    </VStack>
  )
}
