"use client"
import { Grid, GridItem } from "@chakra-ui/react"
import { CreateProposalStepperCard } from "./components/CreateProposalStepperCard"
import { useEffect } from "react"

type Props = {
  children: React.ReactNode
}
export default function FormProposalLayout({ children }: Readonly<Props>) {
  // set color mode of @uiw/react-md-editor
  useEffect(() => {
    document.documentElement.setAttribute("data-color-mode", "light")
    return () => {
      document.documentElement.removeAttribute("data-color-mode")
    }
  }, [])

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
