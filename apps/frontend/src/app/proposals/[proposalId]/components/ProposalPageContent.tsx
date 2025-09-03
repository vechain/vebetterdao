import { Grid, GridItem, VStack, Stack } from "@chakra-ui/react"
import { ProposalOverview } from "./ProposalOverview"
import { useProposalTotalVotes, useVot3PastSupply } from "@/api"
import { ProposalCommunitySupport } from "./ProposalCommunitySupport"
import { ProposalWithdrawDeposit } from "./ProposalWithdrawDeposit"
import { CancelProposalSection } from "./CancelProposalSection/CancelProposalSection"
import { ProposalCanceledAlert } from "./ProposalCanceledAlert"
import { ProposalSessionSection } from "@/components/ProposalSessionSection"
import { ProposalTimeline } from "@/components/ProposalSessionSection/components/ProposalTimeline"
import { useMemo } from "react"
import { ProposalVoteCommentList } from "./ProposalVoteCommentList"
import { CantVoteCard } from "@/app/components/CantVoteCard/CantVoteCard"
import { ProposalState, ProposalType } from "@/hooks/proposals/grants/types"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { ProposalOverviewVotes } from "./ProposalOverview/components/ProposalOverviewVotes/ProposalOverviewVotes"
import { ProposalOverviewTime } from "./ProposalOverview/components/ProposalOverviewTime"
import { ProposalOverviewYourSupport } from "./ProposalOverview/components/ProposalOverviewYourSupport"
import { ProposalOverviewCommunitySupport } from "./ProposalOverview/components/ProposalOverviewCommunitySupport"
import { CastProposalVoteButton } from "./ProposalOverview/components/CastProposalVoteButton"
import { ProposalYourVote } from "@/components"
import { useWallet } from "@vechain/vechain-kit"
import { useProposalDetail } from "../hooks"

type Props = {
  proposalId: string
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const enrichedProposal = useProposalDetail(proposalId)
  const proposal = enrichedProposal.proposal

  const { account } = useWallet()
  const isGrant = useMemo(() => {
    return proposal?.type === ProposalType.Grant
  }, [proposal])

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

  if (!proposal) return null

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

  const InfoProposal = () => (
    <Stack
      direction={["column", "column", "row"]}
      w="full"
      justify={["flex-start", "flex-start", "space-between"]}
      gap={8}>
      <Stack direction={["column", "column", "row"]} gap={[4, 4, 12]} align={["flex-start", "flex-start", "center"]}>
        <ProposalOverviewTime />
        <ProposalOverviewCommunitySupport />
        <ProposalOverviewYourSupport />
        <ProposalYourVote proposalId={proposal.id} proposalState={proposal.state} />
      </Stack>

      {account?.address && <CastProposalVoteButton proposalId={proposal.id} />}
    </Stack>
  )

  const rightSidebarContent = (
    <VStack align="stretch" gap={8}>
      <InfoProposal />

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
          <ProposalOverview isGrant={isGrant} proposalId={proposalId} />
          <ProposalVoteCommentList proposalId={proposalId} />
        </GridItem>
        <GridItem colSpan={[3, 3, 1]}>
          <VStack align="stretch" gap={8}>
            {rightSidebarContent}

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
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  )
}
