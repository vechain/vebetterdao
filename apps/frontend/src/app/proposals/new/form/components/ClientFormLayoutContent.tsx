"use client"
import { Grid, GridItem } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useLayoutEffect } from "react"

import { useNewProposalPageGuard } from "../hooks/useNewProposalPageGuard"

import { CreateProposalStepperCard } from "./CreateProposalStepperCard"
type Props = {
  children: React.ReactNode
}
export const ClientFormLayoutContent = ({ children }: Readonly<Props>) => {
  const router = useRouter()
  const pageGuardResult = useNewProposalPageGuard()
  //   redirect the user to the beginning of the form if the required data is missing
  //   this happens in case the user tries to access this page directly
  useLayoutEffect(() => {
    if (!pageGuardResult.isVisitAuthorized) {
      router.push(pageGuardResult.redirectPath ?? "/proposals/new")
    }
  }, [pageGuardResult, router])
  if (!pageGuardResult.isVisitAuthorized) return null
  return (
    <Grid
      templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(3, 1fr)"]}
      gap={8}
      w="full"
      data-testid="form-proposal-layout">
      <GridItem colSpan={[1, 1, 2]}>{children}</GridItem>
      <GridItem colSpan={1}>
        <CreateProposalStepperCard />
      </GridItem>
    </Grid>
  )
}
