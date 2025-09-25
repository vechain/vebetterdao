import {
  useProposalDepositEvent,
  useProposalInteractionDates,
  useProposalUserDeposit,
  useProposalVotes,
  useUserSingleProposalVoteEvent,
} from "@/api"
import { AddressWithProfilePicture } from "@/app/components/AddressWithProfilePicture"
import B3trIcon from "@/components/Icons/svg/b3tr.svg"
import { GrantsProposalStatusBadge } from "@/components/Proposal/Grants"
import { GrantProposalEnriched, ProposalEnriched, ProposalState, ProposalType } from "@/hooks/proposals/grants/types"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { Card, Heading, HStack, Icon, Separator, Stack, Text, VStack } from "@chakra-ui/react"
import { formatTimeLeft, humanNumber } from "@repo/utils/FormattingUtils"
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
  // ==========================================
  // HOOKS
  // ==========================================
  const router = useRouter()
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isMobile } = useBreakpoints()
  const proposalDepositEvent = useProposalDepositEvent(proposal.id)
  const { data: proposalVotes } = useProposalVotes(proposal.id)
  const { data: userDeposits } = useProposalUserDeposit(proposal.id, account?.address ?? "")
  const { supportEndDate, votingEndDate } = useProposalInteractionDates(proposal.id)
  const { data: userVoteEvent } = useUserSingleProposalVoteEvent(proposal.id)

  // ==========================================
  // COMPUTED VALUES & CONSTANTS
  // ==========================================
  const communityDepositPercentage =
    (proposalDepositEvent.communityDeposits / Number(formatEther(proposal.depositThreshold))) * 100

  const grantProposal = useMemo(() => {
    return isGrantProposal(proposal) ? proposal : null
  }, [proposal])

  const hasUserDeposited = useMemo(() => {
    return BigInt(userDeposits ?? 0) > BigInt(0)
  }, [userDeposits])

  const userVoteOption = userVoteEvent?.userVote
  const hasUserVoted = !!userVoteEvent?.hasVoted

  const isSupportOrVotingPhase = useMemo(() => {
    return proposal.state === ProposalState.Pending || proposal.state === ProposalState.Active
  }, [proposal.state])

  const endsAt = useMemo(() => {
    return proposal.state === ProposalState.Pending ? supportEndDate : votingEndDate
  }, [proposal.state, supportEndDate, votingEndDate])

  const timeLeftDisplay = useMemo(() => {
    if (!isSupportOrVotingPhase) return null
    return formatTimeLeft(endsAt)
  }, [endsAt, isSupportOrVotingPhase])

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  const goToProposal = () => {
    router.push(`/proposals/${proposal.id}`)
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Card.Root
      w="full"
      borderColor="border.secondary"
      borderWidth="1px"
      p={{ base: 5, md: 7 }}
      _hover={{ bg: "gray.50", _dark: { bg: "#000000" } }}
      cursor="pointer"
      onClick={goToProposal}>
      <VStack w="full" gap={4} alignItems="flex-start">
        {/* Header Section */}
        <Heading size={{ base: "lg", lg: "md" }}>{proposal.title}</Heading>

        {/* Grant Information & Proposer Section */}
        <Stack
          direction={{ base: "column", md: "row" }}
          w="full"
          fontSize={{ base: "14px", md: "16px" }}
          justify={{ base: "flex-start" }}
          gap={{ base: 3, md: 2 }}
          align={{ base: "flex-start", md: "center" }}>
          <HStack
            color="text.subtle"
            gap={{ base: 2, md: 3 }}
            flexWrap={{ base: "wrap", sm: "nowrap" }}
            w={{ base: "full", md: "auto" }}>
            {grantProposal && (
              <>
                <HStack gap={2} minW="fit-content">
                  <Icon as={B3trIcon} color="actions.primary.default" boxSize={{ base: 4, md: 5 }} />
                  <Text fontSize={{ base: "sm", lg: "md" }} whiteSpace="nowrap">
                    {humanNumber(grantProposal.grantAmountRequested, grantProposal.grantAmountRequested, "B3TR")}
                  </Text>
                  <Text display={{ base: "none", lg: "block" }} fontSize={{ base: "sm", lg: "md" }}>
                    {"•"} {grantProposal.grantType === "dapp" ? "App" : "Tooling"}
                  </Text>
                </HStack>
                <Separator orientation="vertical" h="16px" />
              </>
            )}
            <HStack minW="fit-content">
              <AddressWithProfilePicture address={proposal.proposerAddress} />
            </HStack>
          </HStack>
          {grantProposal && (
            <>
              {!isMobile && <Separator orientation="vertical" h="16px" />}
              <HStack justify="flex-start">
                <ProposalLinksAndSocials proposal={grantProposal} />
              </HStack>
            </>
          )}
        </Stack>

        <Separator w="full" h={1} color="border.secondary" />

        {/* Footer Section */}
        {isMobile ? (
          // Mobile Layout
          <VStack w="full" gap={2}>
            <HStack w="full" justifyContent="space-between">
              <GrantsProposalStatusBadge
                state={proposal.state}
                hasUserSupported={hasUserDeposited}
                hasUserVoted={hasUserVoted}
              />
              {isSupportOrVotingPhase && (
                <ProposalCommunityInteractions
                  proposalId={proposal.id}
                  state={proposal.state}
                  depositPercentage={communityDepositPercentage}
                  votesFor={proposalVotes?.votes?.for?.percentagePower}
                  votesAgainst={proposalVotes?.votes?.against?.percentagePower}
                  votesAbstain={proposalVotes?.votes?.abstain?.percentagePower}
                  hasUserDeposited={hasUserDeposited}
                  userVoteOption={userVoteOption}
                />
              )}
            </HStack>
            {timeLeftDisplay && (
              <Text fontSize="12px" alignSelf="flex-start" color="text.subtle" pl={2}>
                {t("Ends: {{endDate}}", { endDate: timeLeftDisplay })}{" "}
              </Text>
            )}
          </VStack>
        ) : (
          // Desktop Layout
          <HStack w="full" justifyContent="space-between">
            <HStack gap={4}>
              <GrantsProposalStatusBadge
                state={proposal.state}
                hasUserSupported={hasUserDeposited}
                hasUserVoted={hasUserVoted}
              />
              {timeLeftDisplay ? (
                <Text fontSize="14px" color="text.subtle">
                  {t("Ends: {{endDate}}", {
                    endDate: timeLeftDisplay,
                  })}
                </Text>
              ) : null}
            </HStack>
            <HStack gap={2}>
              <ProposalCommunityInteractions
                proposalId={proposal.id}
                state={proposal.state}
                depositPercentage={communityDepositPercentage}
                votesFor={proposalVotes?.votes?.for?.percentagePower}
                votesAgainst={proposalVotes?.votes?.against?.percentagePower}
                votesAbstain={proposalVotes?.votes?.abstain?.percentagePower}
                hasUserDeposited={hasUserDeposited}
                userVoteOption={userVoteOption}
              />
            </HStack>
          </HStack>
        )}
      </VStack>
    </Card.Root>
  )
}
