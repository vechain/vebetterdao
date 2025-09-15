import {
  useProposalDepositEvent,
  useProposalInteractionDates,
  useProposalUserDeposit,
  useProposalVotesIndexer,
  useUserSingleProposalVoteEvent,
} from "@/api"
import { AddressWithProfilePicture } from "@/app/components/AddressWithProfilePicture"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { GrantsProposalStatusBadge } from "@/components/Proposal/Grants"
import { GrantProposalEnriched, ProposalEnriched, ProposalState, ProposalType } from "@/hooks/proposals/grants/types"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { Box, Card, Center, Heading, HStack, Separator, Stack, Text, VStack } from "@chakra-ui/react"
import { formatTimeLeft } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { formatEther } from "ethers"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ProposalCommunityInteractions } from "./ProposalCommunityInteractions"
import { ProposalLinksAndSocials } from "./ProposalLinksAndSocials"

type GrantsProposalCardProps = {
  proposal: (GrantProposalEnriched | ProposalEnriched) & { isDepositReached: boolean }
}

// Type guard to check if a proposal is a grant proposal
const isGrantProposal = (proposal: GrantProposalEnriched | ProposalEnriched): proposal is GrantProposalEnriched => {
  return proposal.type === ProposalType.Grant
}

export const GrantsProposalCard = ({ proposal }: GrantsProposalCardProps) => {
  const router = useRouter()
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isMobile } = useBreakpoints()
  const proposalDepositEvent = useProposalDepositEvent(proposal.id)
  const { data: proposalVotes } = useProposalVotesIndexer({ proposalId: proposal.id })
  const { data: userDeposits } = useProposalUserDeposit(proposal.id, account?.address ?? "")
  const { supportEndDate, votingEndDate } = useProposalInteractionDates(proposal.id)
  const { data: userVoteEvent } = useUserSingleProposalVoteEvent(proposal.id)
  const isSupportOrVotingPhase = proposal.state === ProposalState.Pending || proposal.state === ProposalState.Active
  const communityDepositPercentage =
    (proposalDepositEvent.communityDeposits / Number(formatEther(proposal.depositThreshold))) * 100

  //Show countdown for next step depending on the proposal state
  const endsAt = proposal.state === ProposalState.Pending ? supportEndDate : votingEndDate

  const goToProposal = () => {
    router.push(`/proposals/${proposal.id}`)
  }

  const grantProposal = useMemo(() => {
    return isGrantProposal(proposal) ? proposal : null
  }, [proposal])

  const hasUserDeposited = useMemo(() => {
    return BigInt(userDeposits ?? 0) > BigInt(0)
  }, [userDeposits])

  // Extract the mapped vote type from the hook
  const userVoteOption = userVoteEvent?.userVote
  const hasUserVoted = !!userVoteEvent?.hasVoted
  return (
    <Card.Root w="full" p={{ base: 5, md: 7 }} cursor="pointer" onClick={goToProposal}>
      <VStack w="full" gap={4} alignItems="flex-start">
        {/* Title */}
        <Heading size="md">{proposal.title}</Heading>

        {/* B3TR and App Grant */}
        <Stack direction={{ base: "column", md: "row" }} w="full" fontSize={{ base: "14px", md: "16px" }} gap={4}>
          <HStack>
            {grantProposal && (
              <>
                {/* Amount and grant type */}
                <B3TRIcon boxSize={{ base: "14px", md: "16px" }} />
                <Text>
                  {grantProposal.grantAmountRequested} {"B3TR"}
                </Text>
                <Box hideBelow="md">
                  <Text>
                    {"•"} {grantProposal.grantType === "dapp" ? "App" : "Tooling"} {"Grant"}
                  </Text>
                </Box>
                {/* Separator */}
                <Center height="20px">
                  <Separator orientation="vertical" />
                </Center>
              </>
            )}
            {/* Proposer */}
            <AddressWithProfilePicture address={proposal.proposerAddress} />
            <Center height="20px">
              <Separator orientation="vertical" />
            </Center>
          </HStack>
          {grantProposal && <ProposalLinksAndSocials proposal={grantProposal} />}
        </Stack>
        <Separator w="full" h={1} />
        {/* Footer */}
        {isMobile ? (
          /* Mobile Layout */
          <VStack w="full" gap={2}>
            <HStack w="full" justifyContent="space-between">
              <GrantsProposalStatusBadge
                state={proposal.state}
                hasUserSupported={hasUserDeposited}
                hasUserVoted={hasUserVoted}
              />
              {isSupportOrVotingPhase && (
                <HStack gap={2}>
                  <ProposalCommunityInteractions
                    proposalId={proposal.id}
                    state={proposal.state}
                    depositPercentage={communityDepositPercentage}
                    votesFor={proposalVotes?.votes.for.percentage}
                    votesAgainst={proposalVotes?.votes.against.percentage}
                    votesAbstain={proposalVotes?.votes.abstain.percentage}
                    hasUserDeposited={hasUserDeposited}
                    userVoteOption={userVoteOption}
                  />
                </HStack>
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
        ) : (
          /* Desktop Layout */
          <HStack w="full" justifyContent="space-between">
            <HStack gap={4}>
              <GrantsProposalStatusBadge
                state={proposal.state}
                hasUserSupported={hasUserDeposited}
                hasUserVoted={hasUserVoted}
              />
              {isSupportOrVotingPhase && endsAt ? (
                <Text fontSize="14px" color="text.subtle">
                  {t("End: {{endDate}}", {
                    endDate: formatTimeLeft(endsAt),
                  })}
                </Text>
              ) : null}
            </HStack>
            {/* {isSupportOrVotingPhase && ( */}
            <HStack gap={2}>
              <ProposalCommunityInteractions
                proposalId={proposal.id}
                state={proposal.state}
                depositPercentage={communityDepositPercentage}
                votesFor={proposalVotes?.votes.for.percentage}
                votesAgainst={proposalVotes?.votes.against.percentage}
                votesAbstain={proposalVotes?.votes.abstain.percentage}
                hasUserDeposited={hasUserDeposited}
                userVoteOption={userVoteOption}
              />
            </HStack>
            {/* )} */}
          </HStack>
        )}
      </VStack>
    </Card.Root>
  )
}
