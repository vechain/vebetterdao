import { Grid, GridItem, VStack } from "@chakra-ui/react"
import { ProposalOverview } from "./ProposalOverview"
import { ProposalContentAndActions } from "./ProposalContentAndActions"
import { useProposalCreatedEvent, useProposalTotalVotes, useVot3PastSupply } from "@/api"
import { useProposalCreatedEvents } from "@/hooks/proposals/common/useProposalCreatedEvents"
import { ProposalCommunitySupport } from "./ProposalCommunitySupport"
import { ProposalWithdrawDeposit } from "./ProposalWithdrawDeposit"
import { CancelProposalSection } from "./CancelProposalSection/CancelProposalSection"
import { ProposalCanceledAlert } from "./ProposalCanceledAlert"
import { useProposalDetail } from "../hooks"
import { ProposalSessionSection } from "@/components/ProposalSessionSection"
import { ProposalTimeline } from "@/components/ProposalSessionSection/components/ProposalTimeline"
import { useMemo } from "react"
import { ProposalVoteCommentList } from "./ProposalVoteCommentList"
import { CantVoteCard } from "@/app/components/CantVoteCard/CantVoteCard"
import { ProposalState, ProposalType } from "@/hooks/proposals/grants/types"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { ProposalOverviewVotes } from "./ProposalOverview/components/ProposalOverviewVotes/ProposalOverviewVotes"

type Props = {
  proposalId: string
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const { data: proposalCreatedEvent } = useProposalCreatedEvent(proposalId)
  const { proposal } = useProposalDetail()
  const { allProposals } = useProposalCreatedEvents()

  const votesAtSnapshotQuery = useVot3PastSupply(proposal.votingStartBlock)

  const totalVotesQuery = useProposalTotalVotes(proposalId)

  const isEnded = [
    ProposalState.Executed,
    ProposalState.Succeeded,
    ProposalState.Defeated,
    ProposalState.Queued,
    ProposalState.DepositNotMet,
  ].includes(proposal.state as ProposalState)

  const shouldNotRenderQuorum = useMemo(() => {
    return [ProposalState.DepositNotMet, ProposalState.Canceled].includes(proposal.state as ProposalState)
  }, [proposal.state])
  const isUpcoming = useMemo(() => {
    return proposal.state === ProposalState.Pending
  }, [proposal])

  if (!proposalCreatedEvent) return null

  let quorumRenderState: "none" | "upcoming" | "active" = "active"
  if (shouldNotRenderQuorum) quorumRenderState = "none"
  if (isUpcoming) quorumRenderState = "upcoming"

  const BreadcrumItems = [
    {
      label: "Proposals", //TODO: This should be dynamic based on the proposal type like "Grants" or "Proposals"
      href: "/proposals",
    },
    {
      label: "Overview",
      href: `/proposals/${proposalId}`,
    },
  ]

  const currentProposal = allProposals.find(proposal => proposal.id === proposalId)
  const isGrantProposal = currentProposal?.type === ProposalType.Grant

  const overviewContent = (
    <VStack align="stretch" gap={8}>
      <ProposalContentAndActions proposal={proposalCreatedEvent} />
    </VStack>
  )

  const rightSidebarContent = (
    <VStack align="stretch" gap={8}>
      <ProposalCommunitySupport />
      {proposal.isUserSupportLeft && <ProposalWithdrawDeposit />}
      {!proposal.isUserSupportLeft && <ProposalWithdrawDeposit />}
      <CancelProposalSection />
    </VStack>
  )

  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <PageBreadcrumb items={BreadcrumItems} />
      {proposal.state === ProposalState.Canceled && <ProposalCanceledAlert />}
      {proposal.state === ProposalState.Active && <CantVoteCard />}

      <Grid templateColumns="repeat(3, 1fr)" gap={[8, 8, 8]} w="full">
        <GridItem colSpan={[3, 3, 2]}>
          <ProposalOverview
            overviewContent={overviewContent}
            proposalCreatedEvent={proposalCreatedEvent}
            isGrantProposal={isGrantProposal}
          />
          <ProposalVoteCommentList proposalId={proposalId} />
        </GridItem>
        <GridItem colSpan={[3, 3, 1]}>
          <VStack align="stretch" gap={8}>
            <ProposalOverviewVotes proposalId={proposalId} />
            <ProposalSessionSection
              quorumQuery={proposal.quorumQuery}
              votesAtSnapshotQuery={votesAtSnapshotQuery}
              userVotesAtSnapshotQuery={proposal.snapshotVotesQuery}
              renderQuroum={quorumRenderState}
              isEnded={isEnded}
              currentVotesQuery={totalVotesQuery}
              renderTimeline={<ProposalTimeline />}
            />
            {rightSidebarContent}
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  )
}
