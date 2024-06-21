"use client"
import { Grid, GridItem } from "@chakra-ui/react"
import { CastAllocationVoteStepperCard } from "./CastAllocationVoteStepperCard"

type Props = {
  children: React.ReactNode
}
export default function CastAllocationVoteLayout({ children }: Readonly<Props>) {
  return (
    <Grid
      templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(4, 1fr)"]}
      gap={8}
      w="full"
      data-testid="cast-allocation-vote-layout">
      <GridItem colSpan={[1, 1, 3]}>{children}</GridItem>
      <GridItem colSpan={1}>
        <CastAllocationVoteStepperCard />
      </GridItem>
    </Grid>
  )
}
