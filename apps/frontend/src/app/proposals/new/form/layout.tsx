"use client"
import { Grid, GridItem } from "@chakra-ui/react"
import { CreateProposalStepperCard } from "./components/CreateProposalStepperCard"

type Props = {
  children: React.ReactNode
}
export default function FormProposalLayout({ children }: Props) {
  return (
    <Grid
      templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(4, 1fr)"]}
      gap={6}
      w="full"
      alignItems={"stretch"}
      data-testid="form-proposal-layout">
      <GridItem colSpan={[1, 1, 3]}>{children}</GridItem>
      <GridItem colSpan={1}>
        <CreateProposalStepperCard />
      </GridItem>
    </Grid>
  )
}
