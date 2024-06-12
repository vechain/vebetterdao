import { Text, Flex, Card, CardHeader, CardBody, Grid, GridItem } from "@chakra-ui/react"
import React from "react"
import { ProposalCreatedEvent, ProposalMetadata, ProposalState } from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { parseDate, toIPFSURL } from "@/utils"
import { useProposalVoteDates } from "@/api/contracts/governance/hooks/useProposalVoteDates"
import VotingProposalProgress from "@/components/Proposal/VotingProposalProgress"
import VotingProposalInfo from "@/components/Proposal/VotingProposalInfo"
import StatusBadge from "@/components/Proposal/StatusBadge"
import { useTranslation } from "react-i18next"
import { useProposalVoteEvent } from "@/api/contracts/governance/hooks/useProposalVoteEvent"

type Props = {
  proposal: ProposalCreatedEvent
  type: ProposalState
}

export const ProposalInfoCard: React.FC<Props> = ({ proposal, type }) => {
  const { proposalId, description, roundIdVoteStart } = proposal
  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(description))

  const { votingStartDate, votingEndDate } = useProposalVoteDates(proposalId)
  const { userVote } = useProposalVoteEvent(proposalId)

  const { t } = useTranslation()

  return (
    <Card flex={1} w="full" variant={"baseWithBorder"}>
      <CardHeader>
        <Flex justifyContent="space-between" alignItems="center">
          <StatusBadge type={type} />
          <Flex alignItems="right" gap={2}>
            <Text fontSize="16px" fontWeight="600" color="#6A6A6A">
              {t("Round #{{round}}", {
                round: roundIdVoteStart,
              })}
            </Text>
            <Text color="#979797" fontWeight="400">
              ({parseDate(votingStartDate)} - {parseDate(votingEndDate)})
            </Text>
          </Flex>
        </Flex>
      </CardHeader>
      <CardBody py={2} mb={4}>
        <Text fontWeight="700" fontSize="20px" mb={4} lineHeight="26.4px">
          {proposalMetadata.data?.title}
        </Text>
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
          <GridItem colSpan={1}>
            <VotingProposalProgress proposalId={proposalId} />
          </GridItem>

          <GridItem colSpan={1}>
            <VotingProposalInfo
              votingStartDate={votingStartDate}
              votingEndDate={votingEndDate}
              proposalId={proposalId}
              userVote={userVote}
            />
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  )
}

export default ProposalInfoCard
