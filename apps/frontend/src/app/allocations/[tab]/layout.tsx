"use client"

import { VStack, Heading, Grid, GridItem } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { CountdownBox } from "../components/CountdownBox"
import { PotentialRewardBox } from "../components/PotentialRewardBox"
import { VotingPowerBox } from "../components/VotingPowerBox"

export default function TabLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <>
      <VStack alignItems="stretch" gap="2" w="full" mb="6">
        <Heading size={{ base: "xl", md: "3xl" }}>{t("Allocation")}</Heading>
        <Grid
          templateRows={{ base: "repeat(2,1fr)", md: "1fr" }}
          templateColumns={{ base: "repeat(2,1fr)", md: "repeat(3,1fr)" }}
          gap="2">
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

      {children}
    </>
  )
}
