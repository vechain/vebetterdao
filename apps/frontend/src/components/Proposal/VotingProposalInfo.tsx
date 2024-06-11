import React from "react"
import { useProposalVoteEvent } from "@/api/contracts/governance/hooks/useProposalVoteEvent"
import { useProposalDepositEvent } from "@/api/contracts/governance/hooks/useProposalDepositEvent"
import { Box, Flex, HStack, Text } from "@chakra-ui/react"
import { UilClock, UilThumbsUp } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { VOT3Icon } from "@/components/Icons"
import { useTranslation } from "react-i18next"

const VotingProposalInfo: React.FC<{
  votingStartDate: number
  votingEndDate: number
  proposalId: string
}> = ({ votingStartDate, votingEndDate, proposalId }) => {
  console.log(proposalId)
  const proposalVoteEvents = useProposalVoteEvent(proposalId)
  const proposalDepositEvent = useProposalDepositEvent(proposalId)
  const { t } = useTranslation()
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
            <Text fontWeight="400" color="#252525" fontSize="16px" lineHeight="25.6px">
              {proposalVoteEvents?.hasUserVoted ? `${proposalDepositEvent?.userSupport} VOT3` : "0 VOT3"}
            </Text>
          </HStack>
        </Box>
      </Flex>
      <Box w="100%" pt={8}>
        <Text fontWeight="400" color="#6A6A6A" fontSize="16px" lineHeight="25.6px">
          {t("Your vote")}
        </Text>
        <HStack>
          <UilThumbsUp width="20px" height="20px" color="#38BF66" />
          <Text fontWeight="600" color="#252525" fontSize="16px" lineHeight="25.6px">
            {t("You voted for")}
          </Text>
        </HStack>
      </Box>
    </Box>
  )
}

export default VotingProposalInfo
