"use client"

import { VStack, Heading, Grid, GridItem } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { redirect, usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"

import { CountdownBox } from "./CountdownBox"
import { PotentialRewardBox } from "./PotentialRewardBox"
import { VotingPowerBox } from "./VotingPowerBox"

export const AllocationLayoutHeader = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const pathname = usePathname()

  if (!account?.address && pathname === "/allocations") redirect("/allocations/round")

  return (
    <VStack alignItems="stretch" gap="2" w="full" mb="6">
      <Heading size={{ base: "xl", md: "3xl" }}>{t("Allocation")}</Heading>
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
