import { Text, Flex, Button, Card, CardHeader, CardBody } from "@chakra-ui/react"
import React from "react"
import { UilAngleRight } from "@iconscout/react-unicons"
import {
  ProposalCreatedEvent,
  ProposalMetadata,
  ProposalState,
  useProposalQuorum,
  useProposalSnapshot,
  useProposalVotes,
} from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { parseDate, toIPFSURL } from "@/utils"
import { useProposalVoteDates } from "@/api/contracts/governance/hooks/useProposalVoteDates"
import VotingProposalProgress from "@/components/Proposal/VotingProposalProgress"
import VotingProposalInfo from "@/components/Proposal/VotingProposalInfo"
import StatusBadge from "@/components/Proposal/StatusBadge"
import { useTranslation } from "react-i18next"

type Props = {
  proposal: ProposalCreatedEvent
  type: ProposalState
}

export const ProposalInfoCard: React.FC<Props> = ({ proposal, type }) => {
  const { proposalId, description, roundIdVoteStart } = proposal
  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(description))
  const { data: proposalSnapshotBlock } = useProposalSnapshot(proposalId)
  const { data: quorum } = useProposalQuorum(proposalSnapshotBlock)
  const { data: proposalVotes } = useProposalVotes(proposalId)
  const { votingStartDate, votingEndDate } = useProposalVoteDates(proposalId)

  const { t } = useTranslation()
  return (
    <Card maxW="840px" backgroundColor="#FFFFFF" variant={"baseWithBorder"} my={4} gap={2}>
      <CardHeader>
        <Flex justifyContent="space-between" alignItems="center">
          <StatusBadge type={type} />
          <Flex alignItems="right" gap={2}>
            <Text fontSize="16px" fontWeight="600" color="#6A6A6A">
              {t("ROUND")} #{roundIdVoteStart}
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
        <Flex alignItems="space-between">
          <VotingProposalProgress proposalVotes={proposalVotes!} quorum={quorum} proposalId={proposalId} />
          <VotingProposalInfo
            votingStartDate={votingStartDate}
            votingEndDate={votingEndDate}
            proposalId={proposal.proposalId}
          />
          <Flex flex="auto" alignItems="flex-end" justifyContent="right">
            <Button borderRadius="56px" width={50} height={50}>
              <UilAngleRight fontSize="md" width={24} height={24} color="#F29B32" />
            </Button>
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  )
}

export default ProposalInfoCard
