import { useIsDepositReached, useProposalUserDeposit, useUserSingleProposalVoteEvent } from "@/api"
import { MilestonesActions } from "@/app/grants/components"
import { GrantProposalEnriched, ProposalEnriched } from "@/hooks/proposals/grants/types"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { Card, Tabs, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { ProposalContentAndActions } from "../ProposalContentAndActions"
import { ProposalOverviewHeader } from "../ProposalOverviewHeader"

type ProposalOverviewProps = {
  isGrant?: boolean
  proposal?: ProposalEnriched | GrantProposalEnriched
}

export const ProposalOverview = ({ isGrant, proposal }: ProposalOverviewProps) => {
  const { account } = useWallet()
  const { data: userDeposits } = useProposalUserDeposit(proposal?.id ?? "", account?.address ?? "")
  const { data: userVoteEvent } = useUserSingleProposalVoteEvent(proposal?.id ?? "")
  const { data: depositReached } = useIsDepositReached(proposal?.id ?? "")
  const { isMobile } = useBreakpoints()

  const proposerAddress = proposal?.proposerAddress ?? ""
  const hasUserVoted = !!userVoteEvent?.hasVoted

  const hasUserDeposited = useMemo(() => {
    return BigInt(userDeposits ?? 0) > BigInt(0)
  }, [userDeposits])

  return (
    <Card.Root variant="primary" w="full" p="8">
      <Card.Body>
        <VStack gap={7} align="flex-start" w="full">
          {!isMobile && proposal && (
            <ProposalOverviewHeader
              proposal={proposal}
              hasUserDeposited={hasUserDeposited}
              hasUserVoted={hasUserVoted}
              depositReached={!!depositReached}
              proposerAddress={proposerAddress}
            />
          )}

          {isGrant ? (
            <Tabs.Root spaceY={7} defaultValue="overview" w="full" fitted lazyMount unmountOnExit>
              <Tabs.List>
                <Tabs.Trigger value="overview">{"Overview"}</Tabs.Trigger>
                <Tabs.Trigger value="milestones">{"Milestones"}</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="overview">
                <ProposalContentAndActions proposal={proposal} />
              </Tabs.Content>
              <Tabs.Content value="milestones">
                <MilestonesActions proposal={proposal as GrantProposalEnriched} />
              </Tabs.Content>
            </Tabs.Root>
          ) : (
            <ProposalContentAndActions proposal={proposal} />
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
