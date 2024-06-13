import React, { useCallback } from "react"
import { useProposalDepositEvent } from "@/api/contracts/governance/hooks/useProposalDepositEvent"
import { Box, Flex, HStack, Icon, IconButton, Image, Skeleton, Text } from "@chakra-ui/react"
import { UilAngleRight, UilClock, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { VOT3Icon } from "@/components/Icons"
import { useTranslation } from "react-i18next"
import { ProposalVoteEvent, VoteType } from "@/api"
import { useRouter } from "next/navigation"

const VotingProposalInfo: React.FC<{
  votingStartDate: number
  votingEndDate: number
  proposalId: string
  userVote?: ProposalVoteEvent
}> = ({ votingStartDate, votingEndDate, proposalId, userVote }) => {
  const { t } = useTranslation()
  const router = useRouter()

  const proposalDepositEvent = useProposalDepositEvent(proposalId)

  const goToProposal = useCallback(() => {
    router.push(`/proposals/${proposalId}`)
  }, [router, proposalId])

  const getVoteStatus = () => {
    switch (Number(userVote?.support)) {
      case VoteType.VOTE_FOR:
        return <UilThumbsUp width="20px" height="20px" color="#38BF66" />
      case VoteType.VOTE_AGAINST:
        return <UilThumbsDown width="20px" height="20px" color="#38BF66" />
      case VoteType.ABSTAIN:
        return <Image src={"/images/abstained.svg"} alt="abstained" />
      default:
        return null
    }
  }
  return (
    <Box px={6}>
      <Flex gap={8}>
        <Box>
          <Text fontWeight="400" color="#6A6A6A" fontSize="16px" lineHeight="25.6px">
            {t("Finish in")}
          </Text>
          <HStack>
            <UilClock width="20px" height="20px" />
            <Text fontWeight="400" color="#252525" fontSize="16px" lineHeight="25.6px">
              {dayjs(votingEndDate).diff(votingStartDate, "day")} {t("days")}
            </Text>
          </HStack>
        </Box>
        <Box>
          <Text fontWeight="400" color="#6A6A6A" fontSize="16px" lineHeight="25.6px">
            {t("Your support")}
          </Text>
          <HStack>
            <VOT3Icon width="20px" height="20px" />
            <Skeleton isLoaded={!proposalDepositEvent.isLoading}>
              <Text fontWeight="400" color="#252525" fontSize="16px" lineHeight="25.6px">
                {proposalDepositEvent?.userSupport}
              </Text>
            </Skeleton>
          </HStack>
        </Box>
      </Flex>
      <HStack w="full" justify={"space-between"} mt={8} align="flex-end">
        <Box w="100%" pt={8}>
          <Text fontWeight="400" color="#6A6A6A" fontSize="16px" lineHeight="25.6px">
            {t("Your vote")}
          </Text>
          <HStack>
            {getVoteStatus()}
            <Text fontWeight="600" color="#252525" fontSize="16px" lineHeight="25.6px">
              {userVote ? t("You voted for") : t("No vote yet")}
            </Text>
          </HStack>
        </Box>
        <IconButton
          icon={<Icon as={UilAngleRight} color="orange" />}
          rounded={"full"}
          onClick={goToProposal}
          aria-label="Go to proposal"
        />
      </HStack>
    </Box>
  )
}

export default VotingProposalInfo
