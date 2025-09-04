import { Text, Card, VStack, HStack, Box, Stack } from "@chakra-ui/react"
import React, { useCallback, useMemo } from "react"
import { parseDate } from "@/utils"
import { useProposalInteractionDates } from "@/api/contracts/governance/hooks/useProposalInteractionDates"
import VotingProposalProgress from "@/components/Proposal/VotingProposalProgress"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { MdArrowOutward } from "react-icons/md"
import { ProposalStatusBadge } from "./ProposalStatusBadge"
import { ProposalEnriched } from "@/hooks/proposals/grants/types"

//TODO: This is a temporary type, we need to fix the type expected
export const ProposalInfoCard: React.FC<{
  proposal: ProposalEnriched
  isDepositReached: boolean
}> = ({ proposal, isDepositReached }) => {
  const { id, description, title, state, type } = proposal
  const router = useRouter()

  const { supportEndDate, votingEndDate } = useProposalInteractionDates(proposal)

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
    <Card.Root
      variant={"baseWithBorder"}
      onClick={goToProposal}
      _hover={{ bg: "hover-contrast-bg" }}
      cursor={"pointer"}
      alignSelf={"flex-start"}
      w={"full"}>
      <Card.Header>
        <HStack hideFrom="md" w={"full"} justifyContent={"space-between"} mb={2}>
          <Text fontSize="16px" fontWeight="600" color="#6A6A6A">
            {t("Round #{{round}}", {
              round: proposal.votingRoundId,
            })}
          </Text>
          <HStack flexDir={{ base: "column", md: "row" }} alignItems="end">
            <Text color="#979797" fontWeight="400">
              {parseDate(supportEndDate)} {t("-")} {parseDate(votingEndDate)}
            </Text>
            <Text color="#979797" fontWeight="400"></Text>
          </HStack>
        </HStack>

        <HStack justifyContent="space-between" alignItems="center" w={"full"}>
          <Text fontSize={20} fontWeight={700} lineClamp={2}>
            {title}
          </Text>

          <VStack hideBelow="md" alignItems="flex-end" gap={0} flex={1}>
            <Text fontSize="16px" fontWeight="600" color="#6A6A6A">
              {t("Round #{{round}}", {
                round: proposal.votingRoundId,
              })}
            </Text>
            <HStack flexDir={{ base: "column", md: "row" }} alignItems="end">
              <Text color="#979797" fontWeight="400">
                {parseDate(supportEndDate)} {t("-")} {parseDate(votingEndDate)}
              </Text>
              <Text color="#979797" fontWeight="400"></Text>
            </HStack>
          </VStack>
        </HStack>
      </Card.Header>
      <Card.Body py={2} mb={4}>
        <Stack direction={["column", "row"]} w="full" justifyContent={"space-between"} gap={4}>
          <Text lineClamp="2" fontSize={16} fontWeight={400} minW={"300px"} flex={2} alignSelf={"flex-start"}>
            {descriptionText}
          </Text>

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
            proposalType={type}
          />
          <HStack cursor={"pointer"}>
            <Text fontWeight={500} color="rgba(0, 76, 252, 1)" fontSize={16}>
              {t("See proposal")}
            </Text>
            <MdArrowOutward color="rgba(0, 76, 252, 1)" size={16} />
          </HStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}

export default ProposalInfoCard
