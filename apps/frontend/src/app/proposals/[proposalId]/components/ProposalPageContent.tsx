import { Grid, GridItem, VStack } from "@chakra-ui/react"
import { ProposalOverview } from "./ProposalOverview"
import { ProposalContentAndActions } from "./ProposalContentAndActions"
import { ProposalState, useProposalCreatedEvent, useProposalTotalVotes, useVot3PastSupply } from "@/api"
import { ProposalCommunitySupport } from "./ProposalCommunitySupport"
import { ProposalWithdrawDeposit } from "./ProposalWithdrawDeposit"
import { ProposalSessionSection } from "../../../../components/ProposalSessionSection"
import { CancelProposalSection } from "./CancelProposalSection/CancelProposalSection"
import { ProposalVoteCommentList } from "./ProposalVoteCommentList"
import { ProposalCanceledAlert } from "./ProposalCanceledAlert"
import { useProposalDetail } from "../hooks"
import { ProposalTimeline } from "@/components/ProposalSessionSection/components/ProposalTimeline"

type Props = {
  proposalId: string
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const { data: proposalCreatedEvent } = useProposalCreatedEvent(proposalId)
  const { proposal } = useProposalDetail()

  const votesAtSnapshotQuery = useVot3PastSupply(proposal.votingStartBlock)

  const totalVotesQuery = useProposalTotalVotes(proposalId)

  if (!proposalCreatedEvent) return null

  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      {proposal.state === ProposalState.Canceled && <ProposalCanceledAlert />}
      <ProposalOverview />
      <Grid templateColumns="repeat(3, 1fr)" gap={[8, 8, 8]} w="full">
        <GridItem colSpan={[3, 3, 2]} gap={8}>
          <VStack align="stretch" gap={8}>
            <ProposalCommunitySupport />
            <ProposalContentAndActions proposal={proposalCreatedEvent} />
            <ProposalVoteCommentList />
          </VStack>
        </GridItem>
        <GridItem colSpan={[3, 3, 1]}>
          <VStack align="stretch" gap={8}>
            {proposal.isUserSupportLeft && <ProposalWithdrawDeposit />}
            <ProposalSessionSection
              quorumQuery={proposal.quorumQuery}
              votesAtSnapshotQuery={votesAtSnapshotQuery}
              userVotesAtSnapshotQuery={proposal.snapshotVotesQuery}
              isEnded={false}
              currentVotesQuery={totalVotesQuery}
              renderTimeline={<ProposalTimeline />}
            />
            {!proposal.isUserSupportLeft && <ProposalWithdrawDeposit />}
            <CancelProposalSection />
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  )
}
