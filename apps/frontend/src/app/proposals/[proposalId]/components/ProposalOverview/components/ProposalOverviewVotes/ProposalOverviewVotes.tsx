import { ProposalState } from "@/api"
import { timestampToTimeLeft } from "@/utils"
import { Box, Flex, Image, Text, VStack } from "@chakra-ui/react"
import { ProposalVotesProgressBar } from "./components/ProposalVotesProgressBar"
import { ProposalVotesResults } from "./components/ProposalVotesResults"
import { UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { ExclamationTriangle } from "@/components"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"

export const ProposalOverviewVotes = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()

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
            <ExclamationTriangle color="#757575" />
            <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
              {t("The community has not supported this proposal and was canceled")}
            </Text>
          </VStack>
        </Flex>
      )

    case ProposalState.Pending:
      if (proposal.isDepositReached) {
        return (
          <Flex h={"full"} bg={"#F8F8F8"} rounded="8px" justify={"center"} alignItems={"center"} flex={1.5}>
            <VStack p="32px">
              <Image w="88px" h="88px" color="#004CFC" src="/images/vote.svg" alt="vote-icon" />
              <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
                {t("This proposal will be voted in")}
              </Text>
              <Text color="#252525" fontWeight={"700"} textAlign={"center"} fontSize="36px">
                {timestampToTimeLeft(proposal.votingStartDate)}
              </Text>
            </VStack>
          </Flex>
        )
      }
      return (
        <Flex h={"full"} bg={"#F8F8F8"} rounded="8px" justify={"center"} alignItems={"center"} flex={1.5}>
          <VStack p="32px">
            <ExclamationTriangle />
            <Text color="#252525" fontWeight={"500"} textAlign={"center"} fontSize="20px">
              {t("This proposal must get the support of the community before the round starts")}
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
    case ProposalState.Defeated:
    case ProposalState.Queued:
    case ProposalState.Executed:
      const borderColorMap = {
        [ProposalState.Active]: undefined,
        [ProposalState.Canceled]: "#D23F63",
        [ProposalState.Defeated]: "#D23F63",
        [ProposalState.Succeeded]: "#38BF66",
        [ProposalState.Queued]: "#38BF66",
        [ProposalState.Executed]: "#38BF66",
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
              {t("Real time votes")}
            </Text>
            <VStack alignItems={"stretch"} gap={6}>
              <ProposalVotesProgressBar
                text="Votes for"
                percentage={proposal.forPercentage}
                color="#38BF66"
                icon={<UilThumbsUp size="16px" color="#38BF66" />}
              />
              <ProposalVotesProgressBar
                text="Against"
                percentage={proposal.againstPercentage}
                color="#D23F63"
                icon={<UilThumbsDown size="16px" color="#D23F63" />}
              />
              <ProposalVotesProgressBar
                text="Abstained"
                percentage={proposal.abstainPercentage}
                color="#B59525"
                icon={<Image src={"/images/abstained.svg"} alt="abstained" />}
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
