import { ProposalState, useCurrentProposal } from "@/api"
import { timestampToTimeLeft } from "@/utils"
import { Box, Flex, Image, Text, VStack } from "@chakra-ui/react"
import { ProposalVotesProgressBar } from "./components/ProposalVotesProgressBar"
import { ProposalVotesResults } from "./components/ProposalVotesResults"
import { UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { ExclamationTriangle } from "@/components"
import { useEffect, useState } from "react"

export const ProposalOverviewVotes = () => {
  const { proposal } = useCurrentProposal()

  const [_, setSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  switch (proposal.state) {
    case ProposalState.DepositNotMet:
      return (
        <Flex h={"full"} bg={"#F8F8F8"} rounded="8px" justify={"center"} alignItems={"center"} flex={1.5}>
          <VStack p="32px">
            <ExclamationTriangle />
            <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
              This proposal must get the support of the community before the round starts
            </Text>
            <Text color="#252525" fontWeight={"700"} textAlign={"center"} fontSize="36px">
              {timestampToTimeLeft(proposal.votingStartDate)}
            </Text>
          </VStack>
        </Flex>
      )
    case ProposalState.Defeated:
      return (
        <Flex h={"full"} bg={"#F8F8F8"} rounded="8px" justify={"center"} alignItems={"center"} flex={1.5}>
          <VStack p="32px">
            <ExclamationTriangle color="#757575" />
            <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
              The community has not supported this proposal and was canceled
            </Text>
          </VStack>
        </Flex>
      )

    case ProposalState.Pending:
      return (
        <Flex h={"full"} bg={"#F8F8F8"} rounded="8px" justify={"center"} alignItems={"center"} flex={1.5}>
          <VStack p="32px">
            <Image w="88px" h="88px" color="#004CFC" src="/images/vote.svg" />
            <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
              This proposal will be voted in
            </Text>
            <Text color="#252525" fontWeight={"700"} textAlign={"center"} fontSize="36px">
              {timestampToTimeLeft(proposal.votingStartDate)}
            </Text>
          </VStack>
        </Flex>
      )

    case ProposalState.Active:
    case ProposalState.Succeeded:
    case ProposalState.Canceled:
      const borderColorMap = {
        [ProposalState.Active]: undefined,
        [ProposalState.Canceled]: "#D23F63",
        [ProposalState.Succeeded]: "#38BF66",
      }
      return (
        <Flex
          h={"full"}
          bg={"#F8F8F8"}
          rounded="8px"
          flex={1.5}
          borderWidth={1}
          borderColor={borderColorMap[proposal.state]}>
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
                icon={<Image src={"/images/abstained.svg"} />}
              />
            </VStack>
            <Box mt={2}>
              <ProposalVotesResults />
            </Box>
          </VStack>
        </Flex>
      )
  }
}
