import { Box, HStack, Text, Flex, Badge, Button } from "@chakra-ui/react"
import React, { useMemo } from "react"
import {
  UilClock,
  UilThumbsUp,
  UilArrowUpRight,
  UilThumbsDown,
  UilAngleRight,
  UilHeart,
  UilBan,
} from "@iconscout/react-unicons"
import { VOT3Icon } from "@/components/Icons"
import { Arm } from "@/components/Icons/Arm"
import {
  ProposalCreatedEvent,
  ProposalMetadata,
  useCurrentBlock,
  useProposal,
  useProposalCreatedEvent,
  useProposalQuorum,
  useProposalSnapshot,
  useProposalState,
  useProposalVotes,
} from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { toIPFSURL } from "@/utils"
import { PROPOSAL_TYPE } from "@/app/proposals/components/ProposalsPageContent"

type Props = {
  proposal: ProposalCreatedEvent
  type: PROPOSAL_TYPE
}

export const ProposalInfoCard: React.FC<Props> = ({ proposal, type }) => {
  if (!proposal) return null
  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(proposal.description))
  const { data: proposalSnapshotBlock } = useProposalSnapshot(proposal.proposalId)
  const { data: quorum, isLoading: quorumLoading } = useProposalQuorum(proposalSnapshotBlock)
  const {
    data: proposalVotes,
    error: proposalVotesError,
    isLoading: proposalVotesLoading,
  } = useProposalVotes(proposal.proposalId)

  const ActiveNowBadge: React.FC = () => {
    return (
      <Box backgroundColor={"#CDFF9F"} borderRadius="full" px={3} py={1}>
        <HStack spacing={2}>
          <Box backgroundColor={"#FC0000"} w={2} h={2} borderRadius="full" />
          <Text fontWeight={"600"} lineHeight={"19.6px"} fontSize={"14px"} color={"#3A6F00"}>
            Active now
          </Text>
        </HStack>
      </Box>
    )
  }

  const LookingForSupportBadge: React.FC = () => {
    return (
      <Box backgroundColor={"#FFF3E5"} borderRadius="full" px={3} py={1}>
        <HStack spacing={2}>
          <UilHeart color={"#F29B32"} height={"16px"} width={"16px"}></UilHeart>
          <Text fontWeight={"600"} lineHeight={"19.6px"} fontSize={"14px"} color={"#F29B32"}>
            Looking for support
          </Text>
        </HStack>
      </Box>
    )
  }

  const UpcomingStatusBadge: React.FC = () => {
    return (
      <Box backgroundColor={"#E0E9FE"} borderRadius="full" px={3} py={1}>
        <HStack spacing={2}>
          <UilClock color={"#F29B32"} width={"16px"} height={"16px"} />
          <Text fontWeight={"600"} lineHeight={"19.6px"} fontSize={"14px"} color={"#004CFC"}>
            Upcoming Voting
          </Text>
        </HStack>
      </Box>
    )
  }

  const EndStatusBadge: React.FC = () => {
    return (
      <Box backgroundColor={"#E0E9FE"} borderRadius="full" px={3} py={1}>
        <HStack spacing={2}>
          <UilThumbsUp color={"#F29B32"} width={"16px"} height={"16px"} />
          <Text fontWeight={"600"} lineHeight={"19.6px"} fontSize={"14px"} color={"#004CFC"}>
            Ended
          </Text>
        </HStack>
      </Box>
    )
  }

  const VotingProposalInfo: React.FC = () => {
    return (
      <Box px={6}>
        <Box>
          <Flex gap={8}>
            <Box>
              <Text fontWeight={"400"} color={"#6A6A6A"} fontSize={"16px"} lineHeight={"25.6px"}>
                Finishes in
              </Text>
              <Box>
                <HStack>
                  <UilClock width={"20px"} height={"20px"} />
                  <Text fontWeight={"400"} color={"#252525"} fontSize={"16px"} lineHeight={"25.6px"}>
                    7 days
                  </Text>
                </HStack>
              </Box>
            </Box>
            <Box>
              <Text fontWeight={"400"} color={"#6A6A6A"} fontSize={"16px"} lineHeight={"25.6px"}>
                Your Support
              </Text>
              <Box>
                <HStack>
                  <VOT3Icon width={"20px"} height={"20px"} />
                  <Text fontWeight={"400"} color={"#252525"} fontSize={"16px"} lineHeight={"25.6px"}>
                    100 V3
                  </Text>
                  <UilArrowUpRight color={"#F29B32"} width={"20px"} height={"20px"} />
                </HStack>
              </Box>
            </Box>
          </Flex>
        </Box>
        <Box w={"100%"} gap={8} pt={8}>
          <Box>
            <Text fontWeight={"400"} color={"#6A6A6A"} fontSize={"16px"} lineHeight={"25.6px"}>
              Your Vote
            </Text>
          </Box>
          <Box>
            <HStack>
              <UilThumbsUp width={"20px"} height={"20px"} color={"#38BF66"} />
              <Text fontWeight={600} color={"#252525"} fontSize={"16px"} lineHeight={"25.6px"}>
                You voted for
              </Text>
              <UilArrowUpRight color={"#F29B32"} width={"20px"} height={"20px"} />
            </HStack>
          </Box>
        </Box>
      </Box>
    )
  }

  const VotingProposalProgress: React.FC = () => {
    if (!proposalVotes) return 0
    const { abstainVotes, forVotes, againstVotes } = proposalVotes
    const totalVotes = Number(abstainVotes) + Number(againstVotes) + Number(forVotes)
    const forPercentage = (Number(forVotes) / totalVotes) * 100 || 0
    const againstPercentage = (Number(againstVotes) / totalVotes) * 100 || 0
    const abstainPercentage = (Number(abstainVotes) / totalVotes) * 100 || 0
    return (
      <Box w={"400px"} border="1px solid #D5D5D5" borderRadius="12px" p={"16px"} bg="#F8F8F8">
        <Text fontSize="md" fontWeight="bold">
          {totalVotes === 0 ? "Waiting for votes.." : "Proposal is being "}
          <Text as="span" color="green.500">
            {totalVotes > 0 &&
              (forPercentage > againstPercentage && forPercentage > abstainPercentage
                ? "approved"
                : againstPercentage > forPercentage && againstPercentage > abstainPercentage
                  ? "rejected"
                  : "abstain")}
          </Text>
        </Text>
        <Box position="relative" height="10px" width="100%" mt={2} bg="gray.200" borderRadius="md">
          <Box height="100%" width={`${forPercentage}%`} bg="green.500" borderRadius="md" position="absolute" />
          <Box
            height="100%"
            width={`${againstPercentage}%`}
            bg="red.500"
            borderRadius="md"
            position="absolute"
            left="80%"
          />
          <Box
            height="100%"
            width={`${abstainPercentage}%`}
            bg="yellow.500"
            borderRadius="md"
            position="absolute"
            left="95%"
          />
        </Box>
        <Flex mt={2}>
          <Box gap={1} display={"inline-flex"}>
            <UilThumbsUp width={18} height={18} color={"#38BF66"} />
            <Text fontSize={"sm"} fontWeight={700} color={"#38BF66"}>
              {forPercentage}%
            </Text>
            <UilThumbsDown width={18} height={18} color={"#D23F63"} />
            <Text fontSize={"sm"} color={"#D23F63"} fontWeight={700}>
              {againstPercentage}%
            </Text>
            <UilBan width={18} height={18} color={"#B59525"} />
            <Text fontSize={"sm"} color={"#B59525"} fontWeight={700}>
              {abstainPercentage}%
            </Text>
          </Box>
        </Flex>
        <Text fontSize="xs" mt={2}>
          {quorum?.formatted} Quorum needed | {totalVotes} votes casted
        </Text>
      </Box>
    )
  }

  const getStatusBadge = () => {
    switch (type) {
      case PROPOSAL_TYPE.ACTIVE:
        return <ActiveNowBadge />
      case PROPOSAL_TYPE.INCOMING:
        return <UpcomingStatusBadge />
      case PROPOSAL_TYPE.PAST:
        return <EndStatusBadge />
    }
  }

  return (
    <Box maxW={"840px"} backgroundColor={"#FFFFFF"} borderWidth="1px" borderRadius="md" m={2} p={8}>
      <Flex justifyContent="space-between" alignItems="center">
        {getStatusBadge()}
        <Flex alignItems={"right"} gap={2}>
          <Text fontSize="16px" fontWeight={600} color="#6A6A6A">
            ROUND #{proposal.roundIdVoteStart}
          </Text>
          <Text color={"#979797"} fontWeight={400}>
            (1 apr - 7 apr)
          </Text>
        </Flex>
      </Flex>

      <Text fontWeight="700" fontSize={"20px"} lineHeight={"26.4px"} py={6}>
        {proposalMetadata.data?.title}
      </Text>

      <Flex alignItems={"space-between"}>
        <VotingProposalProgress />
        <VotingProposalInfo />
        <Flex flex={"auto"} alignItems={"flex-end"} justifyContent={"right"}>
          <Box>
            <Button borderRadius={"56px"} width={50} height={50}>
              <UilAngleRight fontSize={"md"} width={24} height={24} color={"#F29B32"}></UilAngleRight>
            </Button>
          </Box>
        </Flex>
      </Flex>
    </Box>
  )
}
