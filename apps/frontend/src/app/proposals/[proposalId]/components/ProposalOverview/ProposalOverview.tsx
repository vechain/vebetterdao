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
  // ==========================================
  // HOOKS
  // ==========================================
  const { account } = useWallet()
  const { data: userDeposits } = useProposalUserDeposit(proposal?.id ?? "", account?.address ?? "")
  const { data: userVoteEvent } = useUserSingleProposalVoteEvent(proposal?.id ?? "")
  const { data: depositReached } = useIsDepositReached(proposal?.id ?? "")
  const { isMobile } = useBreakpoints()

  // ==========================================
  // COMPUTED VALUES & CONSTANTS
  // ==========================================
  const proposerAddress = proposal?.proposerAddress ?? ""
  const hasUserVoted = !!userVoteEvent?.hasVoted

  const hasUserDeposited = useMemo(() => {
    return BigInt(userDeposits ?? 0) > BigInt(0)
  }, [userDeposits])

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Card.Root variant="baseWithBorder" w="full" borderRadius={"16px"}>
      <Card.Body p={"32px"}>
        <VStack gap={7} align="flex-start" w="full">
          {/* Header section with status badge, proposer info, and title */}
          {!isMobile && proposal && (
            <ProposalOverviewHeader
              proposal={proposal}
              hasUserDeposited={hasUserDeposited}
              hasUserVoted={hasUserVoted}
              depositReached={!!depositReached}
              proposerAddress={proposerAddress}
            />
          )}

          {/* Content section: Tabbed interface for grants, direct content for regular proposals */}
          {isGrant ? (
            /* Grant proposals: Overview and Milestones tabs */
            <Tabs.Root spaceY={7} defaultValue="overview" w="full" colorPalette="blue" fitted lazyMount unmountOnExit>
              <Tabs.List>
                <Tabs.Trigger
                  value="overview"
                  color="text"
                  fontWeight="400"
                  _selected={{
                    color: "#004CFC",
                    fontWeight: "800",
                  }}>
                  {"Overview"}
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="milestones"
                  color="text.subtle"
                  fontWeight="600"
                  _selected={{
                    color: "#004CFC",
                    fontWeight: "800",
                  }}>
                  {"Milestones"}
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="overview">
                <ProposalContentAndActions proposal={proposal} />
              </Tabs.Content>
              <Tabs.Content value="milestones">
                <MilestonesActions proposal={proposal as GrantProposalEnriched} />
              </Tabs.Content>
            </Tabs.Root>
          ) : (
            /* Regular proposals: Direct content display */
            <ProposalContentAndActions proposal={proposal} />
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
