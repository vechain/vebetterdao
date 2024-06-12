import React from "react"
import { useProposalDepositEvent } from "@/api/contracts/governance/hooks/useProposalDepositEvent"
import { useIsDepositReached } from "@/api/contracts/governance/hooks/useIsDepositReached"
import { useProposalCreatedEvent, useProposalQuorum, useProposalSnapshot, useProposalVotes } from "@/api"
import { Box, Card, CardBody, Flex, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { UilBan, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { ethers } from "ethers"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

interface VotingProposalProgressProps {
  proposalId: string
}

const compactFormatter = getCompactFormatter()

const VotingProposalProgress: React.FC<VotingProposalProgressProps> = ({ proposalId }) => {
  const { data: proposalSnapshotBlock, isLoading: snapshotBlockloading } = useProposalSnapshot(proposalId)
  const { data: quorum, isLoading: quorumLoading } = useProposalQuorum(proposalSnapshotBlock, true)
  const proposalDepositEvent = useProposalDepositEvent(proposalId)
  const isDepositReached = useIsDepositReached(proposalId)
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)
  const { data: proposalVotes, isLoading: proposalVotesLoading } = useProposalVotes(proposalId)

  const depositThreshold = Number(ethers.formatEther(BigInt(proposalCreatedEvent.data?.depositThreshold || 0)))
  const communityDeposits = proposalDepositEvent.communityDeposits
  const communityDepositPercentage = communityDeposits / depositThreshold
  const supportingUserCount = proposalDepositEvent.supportingUserCount

  const totalVotes =
    Number(proposalVotes.abstainVotes) + Number(proposalVotes.againstVotes) + Number(proposalVotes.forVotes)
  const forPercentage = (Number(proposalVotes.forVotes) / totalVotes) * 100 || 0
  const againstPercentage = (Number(proposalVotes.againstVotes) / totalVotes) * 100 || 0
  const abstainPercentage = (Number(proposalVotes.abstainVotes) / totalVotes) * 100 || 0

  const { t } = useTranslation()

  const getProposalData = () => {
    if (isDepositReached) {
      return (
        <VStack spacing={2} align="flex-start">
          <Text fontSize="md" fontWeight="bold">
            {totalVotes === 0 ? t("Waiting for votes") : t("Proposal is being")}
            <Text as="span" color="green.500">
              {" "}
              {totalVotes > 0 &&
                (forPercentage > againstPercentage && forPercentage > abstainPercentage
                  ? t("Approved").toLowerCase()
                  : againstPercentage > forPercentage && againstPercentage > abstainPercentage
                    ? t("Rejected").toLowerCase()
                    : t("Abstain").toLowerCase())}
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

          <HStack spacing={4} mt={2} w="full">
            <HStack spacing={2}>
              <UilThumbsUp width={18} height={18} color="#38BF66" />
              <Skeleton isLoaded={!proposalVotesLoading}>
                <Text fontSize="sm" fontWeight="700" color="#38BF66">
                  {forPercentage}%
                </Text>
              </Skeleton>
              <UilThumbsDown width={18} height={18} color="#D23F63" />
              <Skeleton isLoaded={!proposalVotesLoading}>
                <Text fontSize="sm" color="#D23F63" fontWeight="700">
                  {againstPercentage}%
                </Text>
              </Skeleton>
              <UilBan width={18} height={18} color="#B59525" />
              <Skeleton isLoaded={!proposalVotesLoading}>
                <Text fontSize="sm" color="#B59525" fontWeight="700">
                  {abstainPercentage}%
                </Text>
              </Skeleton>
            </HStack>
          </HStack>
          <HStack spacing={1}>
            <Skeleton isLoaded={!quorumLoading && !proposalVotesLoading}>
              <Text fontSize="xs" mt={2} color="#6A6A6A">
                {compactFormatter.format(Number(quorum?.scaled))} {t("Quorum needed")} |{" "}
              </Text>
            </Skeleton>
            <Skeleton isLoaded={!proposalVotesLoading}>
              <Text fontSize="xs" mt={2} color="#6A6A6A">
                {compactFormatter.format(totalVotes)} {t("Votes casted")}
              </Text>
            </Skeleton>
          </HStack>
        </VStack>
      )
    } else {
      return (
        <VStack spacing={2} align="flex-start">
          <Flex justifyContent={"space-between"}>
            <Text fontSize={"sm"} fontWeight={600}>
              {t("Looking for support")}
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
            {t("by")} {supportingUserCount} {t("users")}
          </Text>
        </VStack>
      )
    }
  }

  return (
    <Card variant="filledWithBorder" w="full">
      <CardBody>{getProposalData()}</CardBody>
    </Card>
  )
}

export default VotingProposalProgress
