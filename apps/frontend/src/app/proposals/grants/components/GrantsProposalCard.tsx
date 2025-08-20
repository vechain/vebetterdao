import { HStack, VStack, Heading, Text, Card, Divider, Center, Stack, Hide } from "@chakra-ui/react"
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
    <Card w="full" p={{ base: 5, md: 7 }} cursor="pointer" onClick={goToProposal}>
      <VStack w="full" gap={4} alignItems="flex-start">
        {/* Title */}
        <Heading size="md" noOfLines={2}>
          {proposal.title}
        </Heading>

        {/* B3TR and dApp Grant */}
        <Stack direction={{ base: "column", md: "row" }} w="full" fontSize={{ base: "14px", md: "16px" }} gap={4}>
          <HStack>
            {/* Amount and grant type */}
            <B3TRIcon boxSize={{ base: "14px", md: "16px" }} />
            <Text>
              {proposal.grantAmount} {"B3TR"}
            </Text>
            <Hide below="md">
              <Text>
                {"•"} {proposal?.grantType} {"Grant"}
              </Text>
            </Hide>
            {/* Divider */}
            <Center height="20px">
              <Divider orientation="vertical" />
            </Center>
            {/* Proposer */}
            <AddressWithProfilePicture address={proposal.proposerAddress} />
            <Center height="20px">
              <Divider orientation="vertical" />
            </Center>
          </HStack>
          <ProposalLinksAndSocials proposal={proposal} />
        </Stack>
        <Divider w="full" h={1} />
        {/* Footer */}
        <Stack
          w="full"
          h="full"
          justifyContent="space-between"
          alignContent="center"
          direction={{ base: "column", md: "row" }}
          gap={2}>
          <HStack w="full">
            <GrantsProposalStatusBadge state={proposal.state} />
            {isSupportOrVotingPhase && endsAt ? (
              <Text fontSize={{ base: "10px", md: "14px" }}>
                {t("End: {{endDate}}", {
                  endDate: formatTimeLeft(endsAt),
                })}
              </Text>
            ) : null}
          </HStack>
          <HStack gap={{ base: 3, md: 4 }}>
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
        </Stack>
      </VStack>
    </Card>
  )
}
