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
import { parseDate } from "@/utils"
import { useProposalVoteDates } from "@/api/contracts/governance/hooks/useProposalVoteDates"
import VotingProposalProgress from "@/components/Proposal/VotingProposalProgress"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { MdArrowOutward } from "react-icons/md"
import { ProposalStatusBadge } from "./ProposalStatusBadge"
import { StandardProposalMetadata } from "@/hooks/proposals/grants/types"

export const ProposalInfoCard: React.FC<StandardProposalMetadata & { isDepositReached: boolean }> = ({
  id,
  description,
  votingRoundId,
  title,
  state,
  isDepositReached,
}) => {
  const router = useRouter()

  const { votingStartDate, votingEndDate } = useProposalVoteDates(id)

  const { t } = useTranslation()

  const goToProposal = useCallback(() => {
    router.push(`/proposals/${id}`)
  }, [router, id])

  const descriptionText = useMemo(() => {
    if (description) {
      return description.length > 200 ? `${description.slice(0, 200)}...` : description
    }
    return ""
  }, [description])

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
                round: votingRoundId,
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
          <Skeleton isLoaded={description !== undefined} minH={"20px"} flex={2.5} maxW={{ base: "300px", md: "full" }}>
            <Text fontSize={20} fontWeight={700} noOfLines={2}>
              {title ?? "---"}
            </Text>
          </Skeleton>
          <Show above="sm">
            <VStack alignItems="flex-end" spacing={0} flex={1}>
              <Text fontSize="16px" fontWeight="600" color="#6A6A6A">
                {t("Round #{{round}}", {
                  round: votingRoundId,
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
            isLoaded={description !== undefined}
            minW={"300px"}
            noOfLines={3}
            flex={2}
            alignSelf={"flex-start"}>
            <Text fontSize={16} fontWeight={400} noOfLines={3}>
              {descriptionText}
            </Text>
          </SkeletonText>

          <Box flex={1}>
            <VotingProposalProgress proposalId={id} proposalState={state} isDepositReached={isDepositReached} />
          </Box>
        </Stack>
        <HStack w={"full"} justifyContent={"space-between"} mt={6}>
          <ProposalStatusBadge
            proposalState={state}
            isDepositReached={isDepositReached}
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
