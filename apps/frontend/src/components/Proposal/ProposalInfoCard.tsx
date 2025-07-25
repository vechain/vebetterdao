import {
  Text,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  Box,
  SkeletonText,
  Show,
  Skeleton,
  Stack,
} from "@chakra-ui/react"
import React, { useCallback, useMemo } from "react"
import { ProposalCreatedEvent, ProposalMetadata, ProposalState } from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { parseDate, toIPFSURL } from "@/utils"
import { useProposalVoteDates } from "@/api/contracts/governance/hooks/useProposalVoteDates"
import VotingProposalProgress from "@/components/Proposal/VotingProposalProgress"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { MdArrowOutward } from "react-icons/md"
import { ProposalStatusBadge } from "./ProposalStatusBadge"

type Props = Pick<ProposalCreatedEvent, "proposalId" | "description" | "roundIdVoteStart"> & {
  proposalState?: ProposalState
}

export const ProposalInfoCard: React.FC<Props> = ({ proposalId, description, roundIdVoteStart, proposalState }) => {
  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(description))

  const router = useRouter()

  const { votingStartDate, votingEndDate } = useProposalVoteDates(proposalId)

  const { t } = useTranslation()

  const goToProposal = useCallback(() => {
    router.push(`/proposals/${proposalId}`)
  }, [router, proposalId])

  const descriptionText = useMemo(() => {
    if (proposalMetadata.data) {
      return proposalMetadata.data.shortDescription.length > 200
        ? `${proposalMetadata.data.shortDescription.slice(0, 200)}...`
        : proposalMetadata.data.shortDescription
    }
    return ""
  }, [proposalMetadata.data])

  return (
    <Card
      variant={"baseWithBorder"}
      onClick={goToProposal}
      _hover={{ bg: "hover-contrast-bg" }}
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
                {parseDate(votingStartDate)} {t("-")} {parseDate(votingEndDate)}
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
                  {parseDate(votingStartDate)} {t("-")} {parseDate(votingEndDate)}
                </Text>
                <Text color="#979797" fontWeight="400"></Text>
              </HStack>
            </VStack>
          </Show>
        </HStack>
      </CardHeader>
      <CardBody py={2} mb={4}>
        <Stack direction={["column", "row"]} w="full" justifyContent={"space-between"} spacing={4}>
          <SkeletonText
            isLoaded={proposalMetadata.data !== undefined}
            minW={"300px"}
            noOfLines={3}
            flex={2}
            alignSelf={"flex-start"}>
            <Text fontSize={16} fontWeight={400} noOfLines={3}>
              {descriptionText}
            </Text>
          </SkeletonText>

          <Box flex={1}>
            <VotingProposalProgress proposalId={proposalId} proposalState={proposalState ?? ProposalState.Pending} />
          </Box>
        </Stack>
        <HStack w={"full"} justifyContent={"space-between"} mt={6}>
          <ProposalStatusBadge
            proposalId={proposalId}
            proposalState={proposalState}
            containerProps={{
              py: 1,
              px: 2,
            }}
          />
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
