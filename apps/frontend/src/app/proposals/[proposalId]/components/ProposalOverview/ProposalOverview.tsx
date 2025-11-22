import { Card, Tabs, VStack } from "@chakra-ui/react"
import { useMemo } from "react"

import { useProposalUserDeposit } from "@/api/contracts/governance/hooks/useProposalUserDeposit"
import { useUserSingleProposalVoteEvent } from "@/api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { GrantDetail } from "@/app/grants/types"
import { ProposalDetail } from "@/app/proposals/types"
import { useBreakpoints } from "@/hooks/useBreakpoints"

import { MilestonesActions } from "../../../../grants/components/MilestonesActions"
import { ProposalContentAndActions } from "../ProposalContentAndActions/ProposalContentAndActions"
import { ProposalOverviewHeader } from "../ProposalOverviewHeader/ProposalOverviewHeader"

type ProposalOverviewProps = {
  isGrant?: boolean
  proposal?: ProposalDetail | GrantDetail
}

export const ProposalOverview = ({ isGrant, proposal }: ProposalOverviewProps) => {
  const proposalId = proposal?.proposalId.toString() ?? ""
  const { data: userDeposits } = useProposalUserDeposit(proposalId)
  const { data: userVoteEvent } = useUserSingleProposalVoteEvent(proposalId)
  const { isMobile } = useBreakpoints()
  const proposerAddress = proposal?.proposer ?? ""
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
              depositReached={!!proposal.depositReached}
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
                <MilestonesActions proposal={proposal as GrantDetail} />
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
