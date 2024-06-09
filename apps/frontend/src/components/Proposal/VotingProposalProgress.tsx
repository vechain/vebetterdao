import React from "react"
import { useProposalDepositEvent } from "@/api/contracts/governance/hooks/useProposalDepositEvent"
import { useScaleVot3Amount } from "@/hooks"
import { useIsDepositReached } from "@/api/contracts/governance/hooks/useIsDepositReached"
import { useProposalCreatedEvent } from "@/api"
import { Box, Flex, HStack, Text } from "@chakra-ui/react"
import { UilBan, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"

type ProposalVotesProps = {
  abstainVotes: string
  forVotes: string
  againstVotes: string
}

interface VotingProposalProgressProps {
  proposalId: string
  proposalVotes?: ProposalVotesProps
  quorum?: {
    original: string
    scaled: string
    formatted: string
  }
}

const VotingProposalProgress: React.FC<VotingProposalProgressProps> = ({ proposalId, proposalVotes, quorum }) => {
  if (!proposalVotes) return null
  const proposalDepositEvent = useProposalDepositEvent(proposalId)
  const scaleVot3Amount = useScaleVot3Amount()
  const isDepositReached = useIsDepositReached(proposalId)
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)
  const depositThreshold = Number(scaleVot3Amount(proposalCreatedEvent.data?.depositThreshold))
  const communityDeposits = proposalDepositEvent.communityDeposits
  const communityDepositPercentage = communityDeposits / depositThreshold
  const supportingUserCount = proposalDepositEvent.supportingUserCount
  console.log(communityDepositPercentage)

  const { abstainVotes, forVotes, againstVotes } = proposalVotes
  const totalVotes = Number(abstainVotes) + Number(againstVotes) + Number(forVotes)
  const forPercentage = (Number(forVotes) / totalVotes) * 100 || 0
  const againstPercentage = (Number(againstVotes) / totalVotes) * 100 || 0
  const abstainPercentage = (Number(abstainVotes) / totalVotes) * 100 || 0

  const getProposalData = () => {
    if (isDepositReached) {
      return (
        <>
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
            <HStack spacing={2}>
              <UilThumbsUp width={18} height={18} color="#38BF66" />
              <Text fontSize="sm" fontWeight="700" color="#38BF66">
                {forPercentage}%
              </Text>
              <UilThumbsDown width={18} height={18} color="#D23F63" />
              <Text fontSize="sm" color="#D23F63" fontWeight="700">
                {againstPercentage}%
              </Text>
              <UilBan width={18} height={18} color="#B59525" />
              <Text fontSize="sm" color="#B59525" fontWeight="700">
                {abstainPercentage}%
              </Text>
            </HStack>
          </Flex>
          <Text fontSize="xs" mt={2}>
            {quorum?.original} Quorum needed | {totalVotes} votes casted
          </Text>
        </>
      )
    } else {
      return (
        <>
          <Flex justifyContent={"space-between"}>
            <Text fontSize={"sm"} fontWeight={600}>
              Looking for support
            </Text>
            <Text fontSize={"sm"} fontWeight={600} color={"#004CFC"}>
              {communityDepositPercentage}%
            </Text>
          </Flex>
          <Box position="relative" height="10px" width="100%" my={3} bg="gray.200" borderRadius="md">
            <Box
              height="100%"
              width={`${communityDepositPercentage}%`}
              backgroundColor="#004CFC"
              borderRadius="md"
              position="absolute"
            />
          </Box>
          <Flex mt={2}>
            <HStack spacing={1}>
              <Text fontSize="xs" fontWeight="600" color="#004CFC">
                {communityDeposits} /
              </Text>
              <Text fontSize="xs" fontWeight="600">
                {depositThreshold} VOT3
              </Text>
            </HStack>
          </Flex>
          <Text fontSize="xs" color={"#6A6A6A"} mt={2}>
            by {supportingUserCount} users
          </Text>
        </>
      )
    }
  }

  return (
    <Box w="400px" border="1px solid #D5D5D5" borderRadius="12px" p="16px" bg="#F8F8F8">
      {getProposalData()}
    </Box>
  )
}

export default VotingProposalProgress
