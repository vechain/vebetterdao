import {
  Text,
  Flex,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  Box,
  SkeletonText,
  Show,
  Skeleton,
} from "@chakra-ui/react"
import React, { useCallback } from "react"
import { ProposalCreatedEvent, ProposalMetadata, ProposalState, useIsDepositReached, useProposalState } from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { parseDate, toIPFSURL } from "@/utils"
import { useProposalVoteDates } from "@/api/contracts/governance/hooks/useProposalVoteDates"
import VotingProposalProgress from "@/components/Proposal/VotingProposalProgress"
import StatusBadge from "@/components/Proposal/StatusBadge"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { MdArrowOutward } from "react-icons/md"

type Props = {
  proposal: ProposalCreatedEvent
}

export const ProposalInfoCard: React.FC<Props> = ({ proposal }) => {
  const { proposalId, description, roundIdVoteStart } = proposal
  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(description))

  const router = useRouter()

  const { votingStartDate, votingEndDate } = useProposalVoteDates(proposalId)

  const { t } = useTranslation()

  const { data: proposalState } = useProposalState(proposalId)

  const { data: isDepositReached } = useIsDepositReached(proposalId)

  const goToProposal = useCallback(() => {
    router.push(`/proposals/${proposalId}`)
  }, [router, proposalId])

  return (
    <Card
      variant={"baseWithBorder"}
      onClick={goToProposal}
      _hover={{ bg: "#F8F8F8" }}
      cursor={"pointer"}
      alignSelf={"flex-start"}
      w={"full"}>
      <CardHeader>
        <Show below="sm">
          <HStack w={"full"} justifyContent={"space-between"} mb={2}>
            <Text fontSize="16px" fontWeight="600" color="#6A6A6A">
              {t("Round #{{round}}", {
                round: roundIdVoteStart,
              })}
            </Text>
            <HStack flexDir={{ base: "column", md: "row" }} alignItems="end">
              <Text color="#979797" fontWeight="400">
                {parseDate(votingStartDate)} - {parseDate(votingEndDate)}
              </Text>
              <Text color="#979797" fontWeight="400"></Text>
            </HStack>
          </HStack>
        </Show>
        <HStack justifyContent="space-between" alignItems="center" w={"full"}>
          <Skeleton
            isLoaded={proposalMetadata.data !== undefined}
            minH={"20px"}
            flex={2.5}
            maxW={{ base: "300px", md: "full" }}>
            <Text fontSize={20} fontWeight={700} noOfLines={2}>
              {proposalMetadata.data?.title}
            </Text>
          </Skeleton>
          <Show above="sm">
            <VStack alignItems="flex-end" spacing={0} flex={1}>
              <Text fontSize="16px" fontWeight="600" color="#6A6A6A">
                {t("Round #{{round}}", {
                  round: roundIdVoteStart,
                })}
              </Text>
              <HStack flexDir={{ base: "column", md: "row" }} alignItems="end">
                <Text color="#979797" fontWeight="400">
                  {parseDate(votingStartDate)} - {parseDate(votingEndDate)}
                </Text>
                <Text color="#979797" fontWeight="400"></Text>
              </HStack>
            </VStack>
          </Show>
        </HStack>
      </CardHeader>
      <CardBody py={2} mb={4}>
        <Flex w="full" justifyContent={"space-between"} flexDir={{ base: "column", md: "row" }}>
          <SkeletonText
            isLoaded={proposalMetadata.data !== undefined}
            minH={"90px"}
            minW={"300px"}
            noOfLines={3}
            flex={2.5}
            mr={{ base: 0, md: 10 }}
            alignSelf={"flex-start"}>
            <Text fontSize={16} fontWeight={400} noOfLines={3}>
              {proposalMetadata.data?.shortDescription}
            </Text>
          </SkeletonText>

          <Box flex={1} mt={{ base: 2, md: 0 }}>
            <VotingProposalProgress proposalId={proposalId} proposalState={proposalState ?? ProposalState.Pending} />
          </Box>
        </Flex>
        <HStack w={"full"} justifyContent={"space-between"} mt={6}>
          <Box>
            <StatusBadge type={proposalState ?? ProposalState.Pending} isDepositReached={isDepositReached} />
          </Box>
          <HStack cursor={"pointer"}>
            <Text fontWeight={500} color="rgba(0, 76, 252, 1)" fontSize={16}>
              {t("See proposal")}
            </Text>
            <MdArrowOutward color="rgba(0, 76, 252, 1)" size={16} />
          </HStack>
        </HStack>
      </CardBody>
    </Card>
  )
}

export default ProposalInfoCard
