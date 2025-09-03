import { Card, Button, VStack, HStack, Heading } from "@chakra-ui/react"
import { queryClient } from "@/api"
import { getProposalStateQueryKey } from "@/api/contracts/governance"
import { useApproveMilestone, useClaimGrants, useRejectGrant, useIsMilestoneClaimable } from "@/hooks"
import { useAccountPermissions } from "@/api/contracts/account/hooks"
import { useWallet } from "@vechain/vechain-kit"
import { ProposalEnriched, GrantProposalEnriched } from "@/hooks/proposals/grants/types"

export const MilestonesActions = ({ proposal }: { proposal: ProposalEnriched | GrantProposalEnriched }) => {
  const { account } = useWallet()

  const { data: permissions } = useAccountPermissions(account?.address ?? "")

  const { sendTransaction: approveGrant } = useApproveMilestone({
    proposalId: proposal.id,
    milestoneIndex: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getProposalStateQueryKey(proposal.id) })
    },
  })

  const { sendTransaction: rejectGrant } = useRejectGrant({
    proposalId: proposal.id,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getProposalStateQueryKey(proposal.id) })
    },
  })

  const { sendTransaction: claimMilestone } = useClaimGrants({
    proposalId: proposal.id,
    milestoneIndex: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getProposalStateQueryKey(proposal.id) })
    },
  })

  const { data: isClaimable } = useIsMilestoneClaimable({
    proposalId: proposal.id,
    milestoneIndex: 0,
  })

  const handleApproveGrant = () => {
    approveGrant()
  }
  const handleRejectGrant = () => {
    rejectGrant()
  }

  const handleClaimMilestone = () => {
    claimMilestone()
  }

  return (
    <Card.Root w="full" variant="subtle">
      <Card.Body>
        <HStack>
          <VStack>
            <Heading>{"ADMIN ACTIONS"}</Heading>
            <Button variant="primaryAction" disabled={!permissions?.isGrantApprover} onClick={handleApproveGrant}>
              {"Approve Grant"}
            </Button>
            <Button variant="primaryAction" disabled={!permissions?.isGrantRejector} onClick={handleRejectGrant}>
              {"Reject Grant"}
            </Button>
          </VStack>
          <VStack>
            <Heading>{"GRANTEE ACTIONS"}</Heading>
            <Button variant="primaryAction" disabled={!isClaimable} onClick={handleClaimMilestone}>
              {"Claim Milestone"}
            </Button>
          </VStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}
