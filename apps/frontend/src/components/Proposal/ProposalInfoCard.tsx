import { Box, HStack, Text, Flex, Button } from "@chakra-ui/react"
import React from "react"
import { UilClock, UilThumbsUp, UilAngleRight } from "@iconscout/react-unicons"
import { ProposalCreatedEvent, ProposalMetadata, useProposalQuorum, useProposalSnapshot, useProposalVotes } from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { toIPFSURL } from "@/utils"
import { PROPOSAL_TYPE } from "@/app/proposals/components/ProposalsPageContent"
import { useProposalVoteDates } from "@/api/contracts/governance/hooks/useProposalVoteDates"
import dayjs from "dayjs"
import VotingProposalProgress from "@/components/Proposal/VotingProposalProgress"
import VotingProposalInfo from "@/components/Proposal/VotingProposalInfo"
import ProposalBadge from "@/components/Proposal/ProposalBadge"

type Props = {
  proposal: ProposalCreatedEvent
  type: PROPOSAL_TYPE
}

export const ProposalInfoCard: React.FC<Props> = ({ proposal, type }) => {
  if (!proposal) return null

  const { proposalId, description, roundIdVoteStart } = proposal
  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(description))
  const { data: proposalSnapshotBlock } = useProposalSnapshot(proposalId)
  const { data: quorum } = useProposalQuorum(proposalSnapshotBlock)
  const { data: proposalVotes } = useProposalVotes(proposalId)
  const { votingStartDate, votingEndDate } = useProposalVoteDates(proposalId)

  const getStatusBadge = () => {
    switch (type) {
      case PROPOSAL_TYPE.ACTIVE:
        return (
          <ProposalBadge
            bgColor="#CDFF9F"
            textColor="#3A6F00"
            icon={<Box bg="#FC0000" w={2} h={2} borderRadius="full" />}
            text="Active now"
          />
        )
      case PROPOSAL_TYPE.INCOMING:
        return (
          <ProposalBadge
            bgColor="#E0E9FE"
            textColor="#004CFC"
            icon={<UilClock color="#F29B32" width="16px" height="16px" />}
            text="Upcoming Voting"
          />
        )
      case PROPOSAL_TYPE.PAST:
        return (
          <ProposalBadge
            bgColor="#E0E9FE"
            textColor="#004CFC"
            icon={<UilThumbsUp color="#F29B32" width="16px" height="16px" />}
            text="Ended"
          />
        )
      default:
        return null
    }
  }

  const parseDate = (date: number) => dayjs(date).format("D MMM")

  return (
    <Box maxW="840px" backgroundColor="#FFFFFF" borderWidth="1px" borderRadius="md" m={2} p={8}>
      <Flex justifyContent="space-between" alignItems="center">
        {getStatusBadge()}
        <Flex alignItems="right" gap={2}>
          <Text fontSize="16px" fontWeight="600" color="#6A6A6A">
            ROUND #{roundIdVoteStart}
          </Text>
          <Text color="#979797" fontWeight="400">
            ({parseDate(votingStartDate)} - {parseDate(votingEndDate)})
          </Text>
        </Flex>
      </Flex>
      <Text fontWeight="700" fontSize="20px" lineHeight="26.4px" py={6}>
        {proposalMetadata.data?.title}
      </Text>
      <Flex alignItems="space-between">
        <VotingProposalProgress proposalVotes={proposalVotes} quorum={quorum} proposalId={proposalId} />
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
    </Box>
  )
}

export default ProposalInfoCard
