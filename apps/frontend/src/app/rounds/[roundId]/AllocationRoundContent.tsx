"use client"

import { Grid, GridItem, Spinner, VStack } from "@chakra-ui/react"
import { AllocationRoundNavbar } from "../components/AllocationRoundNavbar"
import { AllocationRoundHeaderCard } from "../components/AllocationRoundHeaderCard/AllocationRoundHeaderCard"
import { AllocationRoundSessionInfoCard } from "../components/AllocationRoundSessionInfoCard"
import { AllocationRoundUserVotes } from "../components/AllocationRoundUserVotes/AllocationRoundUserVotes"
import { useAllocationsRoundState, useHasVotedInRound } from "@/api"
import { useLayoutEffect } from "react"
import { redirect } from "next/navigation"
import { AllocationXAppsVotesCard } from "../components/AllocationXAppsVotesCard"
import { useWallet } from "@vechain/dapp-kit-react"

type Props = {
  roundId: string
}
export const AllocationRoundContent = ({ roundId }: Readonly<Props>) => {
  const { account } = useWallet()

  const currentAllocationState = useAllocationsRoundState(roundId)
  const { data: hasVoted } = useHasVotedInRound(roundId, account ?? undefined)

  useLayoutEffect(() => {
    if (currentAllocationState.error) redirect("/")
  }, [currentAllocationState.error])

  if (currentAllocationState.isLoading)
    return (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    )
  if (currentAllocationState.error) return null

  return (
    <VStack w="full" spacing={8} data-testid={`allocation-${roundId}-page`}>
      <AllocationRoundNavbar roundId={roundId} />
      <AllocationRoundHeaderCard roundId={roundId} />
      <Grid templateColumns="repeat(3, 1fr)" gap={[8, 8, 8]} w="full" alignItems={"flex-start"}>
        <GridItem colSpan={[3, 3, 2]} w="full">
          <VStack spacing={8} w="full">
            {hasVoted && <AllocationRoundUserVotes roundId={roundId} />}
            <AllocationXAppsVotesCard roundId={roundId} />
          </VStack>
        </GridItem>
        <GridItem colSpan={[3, 3, 1]} w="full" pos={"sticky"} top={24} left={0} alignSelf={"start"}>
          <AllocationRoundSessionInfoCard roundId={roundId} />
        </GridItem>
      </Grid>
    </VStack>
  )
}
