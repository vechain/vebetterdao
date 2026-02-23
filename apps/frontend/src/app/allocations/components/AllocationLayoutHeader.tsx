"use client"

import { VStack, Grid, GridItem } from "@chakra-ui/react"

import { CountdownBox } from "./CountdownBox"
import { PotentialRewardBox } from "./PotentialRewardBox"
import { VotingPowerBox } from "./VotingPowerBox"

export const AllocationLayoutHeader = () => {
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
