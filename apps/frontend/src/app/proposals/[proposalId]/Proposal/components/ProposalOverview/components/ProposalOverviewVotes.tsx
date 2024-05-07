import { useCurrentProposal } from "@/api"
import { timestampToTimeLeft } from "@/utils"
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react"
import {
  FaCheckToSlot,
  FaCircleExclamation,
  FaCircleXmark,
  FaThumbsDown,
  FaThumbsUp,
  FaTriangleExclamation,
} from "react-icons/fa6"

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
            {timestampToTimeLeft(proposal.startsInDate)}
          </Text>
        </VStack>
      </Flex>
    )
  }
  if (proposal.isProposalActive) {
    return (
      <Flex h={"full"} bg={"#F8F8F8"} rounded="8px" justify={"center"} alignItems={"center"} flex={1.5}>
        <VStack p="32px">
          <FaCheckToSlot size="60px" color="#004CFC" />
          <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
            The voting session starts in
          </Text>
          <Text color="#252525" fontWeight={"700"} textAlign={"center"} fontSize="36px">
            {timestampToTimeLeft(proposal.startsInDate)}
          </Text>
        </VStack>
      </Flex>
    )
  }

  const forVotes = parseInt(proposal.proposalVotes.forVotes)
  const againstVotes = parseInt(proposal.proposalVotes.againstVotes)
  const abstainVotes = parseInt(proposal.proposalVotes.abstainVotes)
  const totalVotes = forVotes + againstVotes + abstainVotes
  const forPercentage = Math.floor((forVotes / totalVotes) * 100)
  const againstPercentage = Math.floor((againstVotes / totalVotes) * 100)
  const abstainPercentage = Math.floor((abstainVotes / totalVotes) * 100)

  return (
    <Flex h={"full"} bg={"#F8F8F8"} rounded="8px" flex={1.5}>
      <VStack p="24px" alignItems={"stretch"} w="full" justify={"space-between"}>
        <Text color="#000000" fontWeight={"700"} fontSize="20px">
          Real time votes
        </Text>
        <VStack alignItems={"stretch"} gap={6}>
          <VStack alignItems={"stretch"}>
            <HStack justify={"space-between"}>
              <HStack>
                <FaThumbsUp color="#38BF66" />
                <Text color="#38BF66">Votes for</Text>
                <Text color="#38BF66" fontWeight={600}>
                  {forVotes} V3
                </Text>
              </HStack>
              <Text>{forPercentage}%</Text>
            </HStack>
            <Box position="relative">
              <Box bg="#D5D5D5" h="8px" rounded="full" />
              <Box bg="#38BF66" h="8px" rounded="full" w={`${forPercentage}%`} position="absolute" top={0} left={0} />
            </Box>
          </VStack>
          <VStack alignItems={"stretch"}>
            <HStack justify={"space-between"}>
              <HStack>
                <FaThumbsDown color="#D23F63" />
                <Text color="#D23F63">Against</Text>
                <Text color="#D23F63" fontWeight={600}>
                  {againstVotes} V3
                </Text>
              </HStack>
              <Text>{againstPercentage}%</Text>
            </HStack>
            <Box position="relative">
              <Box bg="#D5D5D5" h="8px" rounded="full" />
              <Box
                bg="#D23F63"
                h="8px"
                rounded="full"
                w={`${againstPercentage}%`}
                position="absolute"
                top={0}
                left={0}
              />
            </Box>
          </VStack>
          <VStack alignItems={"stretch"}>
            <HStack justify={"space-between"}>
              <HStack>
                <FaCircleXmark color="#B59525" />
                <Text color="#B59525">Abstained</Text>
                <Text color="#B59525" fontWeight={600}>
                  {abstainVotes} V3
                </Text>
              </HStack>
              <Text>{abstainPercentage}%</Text>
            </HStack>
            <Box position="relative">
              <Box bg="#D5D5D5" h="8px" rounded="full" />
              <Box
                bg="#B59525"
                h="8px"
                rounded="full"
                w={`${abstainPercentage}%`}
                position="absolute"
                top={0}
                left={0}
              />
            </Box>
          </VStack>
        </VStack>
        <HStack>
          <FaCircleExclamation />
          <Text fontSize="14px" color="#6A6A6A">
            Quorum not reached yet
          </Text>
        </HStack>
      </VStack>
    </Flex>
  )
}
