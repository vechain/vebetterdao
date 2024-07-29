import { Card, CardBody, CardHeader, Grid, GridItem, VStack } from "@chakra-ui/react"
import { ProposalOverview } from "./ProposalOverview"
import { ProposalContentAndActions } from "./ProposalContentAndActions"
import { ProposalState, useProposalCreatedEvent, useProposalTotalVotes, useVot3PastSupply } from "@/api"
import { ProposalCommunitySupport } from "./ProposalCommunitySupport"
import { ProposalWithdrawDeposit } from "./ProposalWithdrawDeposit"
import { CancelProposalSection } from "./CancelProposalSection/CancelProposalSection"
import { ProposalVoteCommentList } from "./ProposalVoteCommentList"
import { ProposalCanceledAlert } from "./ProposalCanceledAlert"
import { useProposalDetail } from "../hooks"
import { ProposalSessionSection } from "@/components/ProposalSessionSection"
import { ProposalTimeline } from "@/components/ProposalSessionSection/components/ProposalTimeline"
import { useMemo } from "react"
import { CommentCount, DiscussionEmbed } from "disqus-react"

type Props = {
  proposalId: string
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const { data: proposalCreatedEvent } = useProposalCreatedEvent(proposalId)
  const { proposal } = useProposalDetail()

  const votesAtSnapshotQuery = useVot3PastSupply(proposal.votingStartBlock)

  const totalVotesQuery = useProposalTotalVotes(proposalId)

  const isEnded = proposal.state === ProposalState.DepositNotMet

  const isCanceled = proposal.state === ProposalState.Canceled

  const isUpcoming = useMemo(() => {
    return !isEnded && !proposal.quorumQuery.isLoading && !proposal.quorumQuery.data
  }, [proposal, isEnded])

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
              renderQuroum={isCanceled ? "none" : isUpcoming ? "upcoming" : "active"}
              isEnded={isEnded}
              currentVotesQuery={totalVotesQuery}
              renderTimeline={<ProposalTimeline />}
            />
            {!proposal.isUserSupportLeft && <ProposalWithdrawDeposit />}
            <CancelProposalSection />
          </VStack>
        </GridItem>
      </Grid>
      <Card variant="baseWithBorder">
        <CardHeader>
          <CommentCount
            shortname="vbd-1"
            config={{
              url: "https://b3tr-frontend.vercel.app/propopsals/" + proposal.id,
              identifier: "https://b3tr-frontend.vercel.app/",
              title: proposal.title,
            }}>
            {/* Placeholder Text */}
          </CommentCount>
        </CardHeader>
        <CardBody>
          <DiscussionEmbed
            shortname="vbd-1"
            config={{
              url: "https://b3tr-frontend.vercel.app/propopsals/" + proposal.id,
              identifier: "https://b3tr-frontend.vercel.app/",
              title: proposal.title,
              language: "en_EN", //e.g. for Traditional Chinese (Taiwan)
            }}
          />
        </CardBody>
      </Card>
    </VStack>
  )
}
