import { useIsDepositReached, useProposalUserDeposit, useUserSingleProposalVoteEvent } from "@/api"
import { AddressWithProfilePicture } from "@/app/components/AddressWithProfilePicture"
import { GrantsProposalStatusBadge } from "@/components/Proposal/Grants"
import { GrantProposalEnriched, ProposalEnriched, ProposalState } from "@/hooks/proposals/grants/types"
import { Card, Heading, HStack, Tabs, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { MilestonesActions } from "../../../grants/components"
import { ProposalContentAndActions } from "../ProposalContentAndActions"

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

  // ==========================================
  // COMPUTED VALUES & CONSTANTS
  // ==========================================
  const proposerAddress = proposal?.proposerAddress ?? ""
  const hasUserVoted = !!userVoteEvent?.hasVoted

  const hasUserDeposited = useMemo(() => {
    return BigInt(userDeposits ?? 0) > BigInt(0)
  }, [userDeposits])

  // ==========================================
  // COMPONENTS
  // ==========================================
  const HeaderContent = () => (
    <VStack align="flex-start" w="full">
      {/* Status badge and proposer info */}
      <HStack justify={"space-between"} align={"flex-start"} w="full">
        <GrantsProposalStatusBadge
          state={proposal?.state ?? ProposalState.Pending}
          hasUserSupported={hasUserDeposited}
          hasUserVoted={hasUserVoted}
          depositReached={depositReached ?? false}
        />

        <AddressWithProfilePicture address={proposerAddress} />
      </HStack>

      {/* Proposal title */}
      <Heading size={["2xl", "4xl"]} py={"40px"}>
        {proposal?.title}
      </Heading>
    </VStack>
  )

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Card.Root variant="baseWithBorder" w="full" borderRadius={"16px"}>
      <Card.Body p={"32px"}>
        <VStack gap={7} align="flex-start" w="full">
          {/* Header section with status badge, proposer info, and title */}
          <HeaderContent />

          {/* Content section: Tabbed interface for grants, direct content for regular proposals */}
          {isGrant ? (
            /* Grant proposals: Overview and Milestones tabs */
            <Tabs.Root spaceY={7} defaultValue="overview" w="full" colorPalette="blue" fitted>
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
