import {
  Text,
  Card,
  VStack,
  HStack,
  Box,
  Icon,
  SkeletonText,
  Skeleton,
  Stack,
  LinkBox,
  LinkOverlay,
} from "@chakra-ui/react"
import React, { useMemo } from "react"
import { ProposalCreatedEvent, ProposalMetadata, ProposalState } from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { toIPFSURL } from "@/utils"
//import { useProposalVoteDates } from "@/api/contracts/governance/hooks/useProposalVoteDates"
import VotingProposalProgress from "@/components/Proposal/VotingProposalProgress"
import { useTranslation } from "react-i18next"
import { MdArrowOutward } from "react-icons/md"
import { ProposalStatusBadge } from "./ProposalStatusBadge"
import NextLink from "next/link"

type Props = Pick<ProposalCreatedEvent, "proposalId" | "description" | "roundIdVoteStart"> & {
  proposalState?: ProposalState
}

export const ProposalInfoCard: React.FC<Props> = ({ proposalId, description, roundIdVoteStart, proposalState }) => {
  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(description))
  // TODO: this info is hidden in the new design, add it back in case of need
  // const { votingStartDate, votingEndDate } = useProposalVoteDates(proposalId)

  const { t } = useTranslation()

  const descriptionText = useMemo(() => {
    if (proposalMetadata.data) {
      return proposalMetadata.data.shortDescription.length > 200
        ? `${proposalMetadata.data.shortDescription.slice(0, 200)}...`
        : proposalMetadata.data.shortDescription
    }
  }, [proposalMetadata.data])

  return (
    <LinkBox asChild>
      <Card.Root variant="primary" alignSelf={"flex-start"} w={"full"} p="4">
        <LinkOverlay asChild href={`/proposals/${proposalId}`}>
          <NextLink href={`/proposals/${proposalId}`} />
        </LinkOverlay>
        <Card.Header flex={1} w="full" pb="4">
          <HStack hideFrom="md" w={"full"} justifyContent={"space-between"} mb={2}>
            <Text textStyle="md" fontWeight="semibold" color="text.subtle">
              {t("Round #{{round}}", { round: roundIdVoteStart })}
            </Text>
          </HStack>

          <HStack justifyContent="space-between" alignItems="center" w={"full"}>
            <Skeleton
              loading={proposalMetadata.isLoading}
              minH={"20px"}
              flex={2.5}
              maxW={{ base: "300px", md: "full" }}>
              <Text textStyle="xl" fontWeight="bold" lineClamp={2}>
                {proposalMetadata.data?.title}
              </Text>
            </Skeleton>

            <VStack hideBelow="md" alignItems="flex-end" gap={1} flex={1}>
              <Text textStyle="md" fontWeight="semibold" color="text.subtle">
                {t("Round #{{round}}", { round: roundIdVoteStart })}
              </Text>
            </VStack>
          </HStack>
        </Card.Header>
        <Card.Body gap="4">
          <Stack direction={["column", "row"]} w="full" justifyContent={"space-between"} gap={6}>
            {proposalMetadata.isLoading ? (
              <SkeletonText noOfLines={3} flex={2} />
            ) : (
              <Text lineClamp={{ base: 2, md: 3 }} textStyle="md" minW={"300px"} flex={2} alignSelf={"flex-start"}>
                {descriptionText}
              </Text>
            )}

            <Box flex={1}>
              <VotingProposalProgress proposalId={proposalId} proposalState={proposalState ?? ProposalState.Pending} />
            </Box>
          </Stack>
          <HStack w={"full"} justifyContent={"space-between"}>
            <ProposalStatusBadge proposalId={proposalId} proposalState={proposalState} />
            <HStack>
              <Text fontWeight="semibold" color="brand.primary" textStyle="sm">
                {t("See proposal")}
              </Text>

              <Icon as={MdArrowOutward} color="brand.primary" boxSize="5" />
            </HStack>
          </HStack>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}

export default ProposalInfoCard
