import { useCurrentProposal } from "@/api"
import { timestampToTimeLeft } from "@/utils"
import { Box, Flex, Image, Spacer, Text, VStack } from "@chakra-ui/react"
import { FaCheckToSlot, FaCircleXmark, FaThumbsDown, FaThumbsUp, FaTriangleExclamation } from "react-icons/fa6"
import { ProposalVotesProgressBar } from "./components/ProposalVotesProgressBar"
import { ProposalVotesResults } from "./components/ProposalVotesResults"
import { UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"

export const ProposalOverviewVotes = () => {
  const { proposal } = useCurrentProposal()

  if (proposal.isDepositPending) {
    return (
      <Flex h={"full"} bg={"#F8F8F8"} rounded="8px" justify={"center"} alignItems={"center"} flex={1.5}>
        <VStack p="32px">
          <Image w="88px" h="88px" color="#F29B32" src="/icons/exclamation-triangle.svg" />
          <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
            This proposal must get the support of the community before the round starts
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
          <Image w="88px" h="88px" color="#004CFC" src="/icons/vote.svg" />
          <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
            This proposal will be voted in
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
            text="Votes for"
            votes={proposal.forVotes}
            percentage={proposal.forPercentage}
            color="#38BF66"
            icon={<UilThumbsUp size="16px" color="#38BF66" />}
          />
          <ProposalVotesProgressBar
            text="Against"
            votes={proposal.againstVotes}
            percentage={proposal.againstPercentage}
            color="#D23F63"
            icon={<UilThumbsDown size="16px" color="#D23F63" />}
          />
          <ProposalVotesProgressBar
            text="Abstained"
            votes={proposal.abstainVotes}
            percentage={proposal.abstainPercentage}
            color="#B59525"
            icon={<Image src={"/icons/abstained.svg"} />}
          />
        </VStack>
        <Box mt={2}>
          <ProposalVotesResults />
        </Box>
      </VStack>
    </Flex>
  )
}
