import { VStack, Heading, Grid, GridItem } from "@chakra-ui/react"

import { CountdownBox } from "../components/CountdownBox"
import { PotentialRewardBox } from "../components/PotentialRewardBox"
import { VotingPowerBox } from "../components/VotingPowerBox"
import { getCurrentRoundId } from "../lib/data"

export default async function TabLayout({ children }: { children: React.ReactNode }) {
  const currentRoundId = await getCurrentRoundId()
  return (
    <>
      <VStack alignItems="stretch" gap="2" w="full" mb="6">
        <Heading size={{ base: "xl", md: "3xl" }}>{"Allocation"}</Heading>
        <Grid
          templateRows={{ base: "repeat(2,1fr)", md: "1fr" }}
          templateColumns={{ base: "repeat(2,1fr)", md: "repeat(3,1fr)" }}
          gap="2">
          <GridItem colSpan={{ base: 2, md: 1 }} w="full">
            <VotingPowerBox />
          </GridItem>
          <GridItem asChild>
            <PotentialRewardBox currentRoundId={currentRoundId} />
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
