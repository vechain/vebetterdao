import { HStack, VStack, Heading, Text, Card, Separator, Center, Stack, Box } from "@chakra-ui/react"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { GrantsProposalStatusBadge } from "@/components/Proposal/Grants"
import { useRouter } from "next/navigation"
import { ProposalState, GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import { formatTimeLeft } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { useEstimateFutureRoundTimestamp } from "@/hooks"
import { useCurrentAllocationsRoundId, useProposalDepositEvent, useProposalVotesIndexer } from "@/api"
import { formatEther } from "ethers"
import { ProposalLinksAndSocials } from "./ProposalLinksAndSocials"
import { AddressWithProfilePicture } from "@/app/components/AddressWithProfilePicture"
import { ProposalCommunityInteractions } from "./ProposalCommunityInteractions"

type GrantsProposalCardProps = {
  proposal: GrantProposalEnriched
}

export const GrantsProposalCard = ({ proposal }: GrantsProposalCardProps) => {
  const router = useRouter()
  const { t } = useTranslation()
  const proposalDepositEvent = useProposalDepositEvent(proposal.id)
  const { data: proposalVotes } = useProposalVotesIndexer({ proposalId: proposal.id })

  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  const supportPhaseEndsAt = useEstimateFutureRoundTimestamp({
    currentRoundId: currentRoundId ?? "",
    targetRoundId: proposal.votingRoundId,
  })
  const votingPhaseEndsAt = useEstimateFutureRoundTimestamp({
    currentRoundId: currentRoundId ?? "",
    targetRoundId: proposal.votingRoundId,
  })

  const isSupportOrVotingPhase = proposal.state === ProposalState.Pending || proposal.state === ProposalState.Active
  const communityDepositPercentage =
    (proposalDepositEvent.communityDeposits / Number(formatEther(proposal.depositThreshold))) * 100

  //Show countdown for next step depending on the proposal state
  const endsAt = proposal.state === ProposalState.Pending ? supportPhaseEndsAt : votingPhaseEndsAt

  const goToProposal = () => {
    router.push(`/proposals/${proposal.id}`)
  }

  return (
    <Card.Root w="full" p={{ base: 5, md: 7 }} cursor="pointer" onClick={goToProposal}>
      <VStack w="full" gap={4} alignItems="flex-start">
        {/* Title */}
        <Heading size="md">{proposal.title}</Heading>

        {/* B3TR and dApp Grant */}
        <Stack direction={{ base: "column", md: "row" }} w="full" fontSize={{ base: "14px", md: "16px" }} gap={4}>
          <HStack>
            {/* Amount and grant type */}
            <B3TRIcon boxSize={{ base: "14px", md: "16px" }} />
            <Text>
              {proposal.grantAmountRequested} {"B3TR"}
            </Text>
            <Box hideBelow="md">
              <Text>
                {"•"} {proposal?.grantType} {"Grant"}
              </Text>
            </Box>
            {/* Separator */}
            <Center height="20px">
              <Separator orientation="vertical" />
            </Center>
            {/* Proposer */}
            <AddressWithProfilePicture address={proposal.proposerAddress} />
            <Center height="20px">
              <Separator orientation="vertical" />
            </Center>
          </HStack>
          <ProposalLinksAndSocials proposal={proposal} />
        </Stack>
        <Separator w="full" h={1} />
        {/* Footer */}
        {/* Mobile Layout */}
        <VStack w="full" gap={2} display={{ base: "flex", md: "none" }}>
          <HStack w="full" justifyContent="space-between">
            <GrantsProposalStatusBadge state={proposal.state} />
            {isSupportOrVotingPhase && (
              <ProposalCommunityInteractions
                state={proposal.state}
                depositPercentage={communityDepositPercentage}
                votesFor={proposalVotes?.votes.for.percentage ?? 0}
                votesAgainst={proposalVotes?.votes.against.percentage ?? 0}
                votesAbstain={proposalVotes?.votes.abstain.percentage ?? 0}
              />
            )}
          </HStack>
          {isSupportOrVotingPhase && endsAt ? (
            <Text fontSize="12px" alignSelf="flex-start" color="text.subtle" pl={2}>
              {t("End: {{endDate}}", {
                endDate: formatTimeLeft(endsAt),
              })}
            </Text>
          ) : null}
        </VStack>

        {/* Desktop Layout */}
        <HStack w="full" justifyContent="space-between" display={{ base: "none", md: "flex" }}>
          <HStack gap={4}>
            <GrantsProposalStatusBadge state={proposal.state} />
            {isSupportOrVotingPhase && endsAt ? (
              <Text fontSize="14px" color="text.subtle">
                {t("End: {{endDate}}", {
                  endDate: formatTimeLeft(endsAt),
                })}
              </Text>
            ) : null}
          </HStack>
          {isSupportOrVotingPhase && (
            <ProposalCommunityInteractions
              state={proposal.state}
              depositPercentage={communityDepositPercentage}
              votesFor={proposalVotes?.votes.for.percentage ?? 0}
              votesAgainst={proposalVotes?.votes.against.percentage ?? 0}
              votesAbstain={proposalVotes?.votes.abstain.percentage ?? 0}
            />
          )}
        </HStack>
      </VStack>
    </Card.Root>
  )
}
