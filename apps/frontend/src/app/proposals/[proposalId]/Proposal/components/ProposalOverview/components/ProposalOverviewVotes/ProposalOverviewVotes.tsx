import { useCurrentProposal } from "@/api"
import { timestampToTimeLeft } from "@/utils"
import { Flex, Text, VStack } from "@chakra-ui/react"
import { FaCheckToSlot, FaCircleXmark, FaThumbsDown, FaThumbsUp, FaTriangleExclamation } from "react-icons/fa6"
import { ProposalVotesProgressBar } from "./components/ProposalVotesProgressBar"
import { ProposalVotesResults } from "./components/ProposalVotesResults"

export const ProposalOverviewVotes = () => {
  const { proposal } = useCurrentProposal()

  if (proposal.isDepositPending) {
    return (
      <Flex h={"full"} bg={"#F8F8F8"} rounded="8px" justify={"center"} alignItems={"center"} flex={1.5}>
        <VStack p="32px">
          <FaTriangleExclamation size="60px" color="#F29B32" />
          <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
            This proposal has to reach the necessary VOT3 before
          </Text>
          <Text color="#252525" fontWeight={"700"} textAlign={"center"} fontSize="36px">
            {timestampToTimeLeft(proposal.startDate)}
          </Text>
        </VStack>
      </Flex>
    )
  }
  if (!proposal.isProposalActive) {
    return (
      <Flex h={"full"} bg={"#F8F8F8"} rounded="8px" justify={"center"} alignItems={"center"} flex={1.5}>
        <VStack p="32px">
          <FaCheckToSlot size="60px" color="#004CFC" />
          <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
            The voting session starts in
          </Text>
          <Text color="#252525" fontWeight={"700"} textAlign={"center"} fontSize="36px">
            {timestampToTimeLeft(proposal.startDate)}
          </Text>
        </VStack>
      </Flex>
    )
  }

  return (
    <Flex h={"full"} bg={"#F8F8F8"} rounded="8px" flex={1.5}>
      <VStack p="24px" alignItems={"stretch"} w="full" justify={"space-between"}>
        <Text color="#000000" fontWeight={"700"} fontSize="20px">
          Real time votes
        </Text>
        <VStack alignItems={"stretch"} gap={6}>
          <ProposalVotesProgressBar
            votes={proposal.forVotes}
            percentage={proposal.forPercentage}
            color="#38BF66"
            icon={<FaThumbsUp color="#38BF66" />}
          />
          <ProposalVotesProgressBar
            votes={proposal.againstVotes}
            percentage={proposal.againstPercentage}
            color="#D23F63"
            icon={<FaThumbsDown color="#D23F63" />}
          />
          <ProposalVotesProgressBar
            votes={proposal.abstainVotes}
            percentage={proposal.abstainPercentage}
            color="#B59525"
            icon={<FaCircleXmark color="#B59525" />}
          />
        </VStack>
        <ProposalVotesResults />
      </VStack>
    </Flex>
  )
}
