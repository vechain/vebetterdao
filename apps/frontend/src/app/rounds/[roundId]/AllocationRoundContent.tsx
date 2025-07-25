"use client"

import { Grid, GridItem, Show, Spinner, VStack, useBreakpointValue } from "@chakra-ui/react"
import { AllocationRoundNavbar } from "../components/AllocationRoundNavbar"
import { AllocationRoundHeaderCard } from "../components/AllocationRoundHeaderCard/AllocationRoundHeaderCard"
import { AllocationRoundSessionInfoCard } from "../components/AllocationRoundSessionInfoCard"
import { AllocationRoundUserVotes } from "../components/AllocationRoundUserVotes/AllocationRoundUserVotes"
import { useAllocationsRoundState, useHasVotedInRound } from "@/api"
import { useLayoutEffect } from "react"
import { redirect } from "next/navigation"
import { AllocationXAppsVotesCard } from "../components/AllocationXAppsVotesCard"
import { useWallet } from "@vechain/vechain-kit"
import { AllocationVoterRewards } from "../components/AllocationVoterRewards"
import { CantVoteCard } from "@/app/components/CantVoteCard/CantVoteCard"
import { useBreakpoints } from "@/hooks"

type Props = {
  roundId: string
}
export const AllocationRoundContent = ({ roundId }: Readonly<Props>) => {
  const { account } = useWallet()
  const { isMobile } = useBreakpoints()

  const userVoteMinPercentageToNotMerge = useBreakpointValue(
    {
      base: 25,
      lg: 12.5,
    },
    {
      // Breakpoint to use when mediaqueries cannot be used, such as in server-side rendering
      // (Defaults to 'base')
      fallback: "base",
    },
  )

  const currentAllocationState = useAllocationsRoundState(roundId)
  const { data: hasVoted } = useHasVotedInRound(roundId, account?.address ?? undefined)

  useLayoutEffect(() => {
    if (currentAllocationState.error) redirect("/")
  }, [currentAllocationState.error])

  if (currentAllocationState.isLoading)
    return (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    )
  if (currentAllocationState.error) return null

  return (
    <VStack w="full" gap={8} data-testid={`allocation-${roundId}-page`}>
      <AllocationRoundNavbar roundId={roundId} />
      <CantVoteCard />
      <AllocationRoundHeaderCard roundId={roundId} />
      <Grid templateColumns="repeat(3, 1fr)" gap={[8, 8, 8]} w="full" alignItems={"flex-start"}>
        <GridItem colSpan={[3, 3, 2]} w="full">
          <VStack gap={8} w="full">
            <Show when={isMobile}>
              <AllocationVoterRewards roundId={roundId} hasVoted={hasVoted} />
            </Show>
            {hasVoted && (
              <AllocationRoundUserVotes roundId={roundId} minPercentageToNotMerge={userVoteMinPercentageToNotMerge} />
            )}
            <AllocationXAppsVotesCard roundId={roundId} />
          </VStack>
        </GridItem>
        <GridItem colSpan={[3, 3, 1]} w="full" alignSelf={"start"}>
          <AllocationRoundSessionInfoCard roundId={roundId} />
          <Show when={!isMobile}>
            <AllocationVoterRewards roundId={roundId} hasVoted={hasVoted} />
          </Show>
        </GridItem>
      </Grid>
    </VStack>
  )
}
