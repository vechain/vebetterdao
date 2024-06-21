"use client"
import { Grid, GridItem, VStack } from "@chakra-ui/react"
import { CastAllocationVoteStepperCard } from "./components/CastAllocationVoteStepperCard"
import { YourVoteBalanceCard } from "./components/YourVoteBalanceCard"

type Props = {
  children: React.ReactNode
  params: {
    roundId: string
  }
}
export default function CastAllocationVoteLayout({ children, params }: Readonly<Props>) {
  return (
    <Grid
      templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(3, 1fr)"]}
      gap={8}
      w="full"
      data-testid="cast-allocation-vote-layout">
      <GridItem colSpan={[1, 1, 2]}>{children}</GridItem>
      <GridItem colSpan={1}>
        <VStack spacing={8} align="flex-start" w="full">
          <CastAllocationVoteStepperCard />
          <YourVoteBalanceCard roundId={params.roundId} />
        </VStack>
      </GridItem>
    </Grid>
  )
}
