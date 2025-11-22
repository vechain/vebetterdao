import { Card, Heading, HStack, Separator, Stack, Text, VStack } from "@chakra-ui/react"
import { formatTimeLeft } from "@repo/utils/FormattingUtils"
import BigNumber from "bignumber.js"
import { formatEther } from "ethers"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useProposalUserDeposit } from "@/api/contracts/governance/hooks/useProposalUserDeposit"
import { useUserSingleProposalVoteEvent } from "@/api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { ProposalDetail } from "@/app/proposals/types"
import { ProposalState, ProposalType } from "@/hooks/proposals/grants/types"
import { useBreakpoints } from "@/hooks/useBreakpoints"

import { GroupedProposalVotes, ProposalVotes } from "../../../api/indexer/proposals/useProposalVotes"
import { GrantsProposalStatusBadge } from "../../../components/Proposal/Grants/GrantsProposalStatusBadge"
import { AddressWithProfilePicture } from "../../components/AddressWithProfilePicture/AddressWithProfilePicture"
import { GrantDetail } from "../types"

import { ProposalCommunityInteractions } from "./ProposalCommunityInteractions"
import { ProposalLinksAndSocials } from "./ProposalLinksAndSocials"

type GrantsProposalCardProps = {
  proposal: GrantDetail | ProposalDetail
  variant?: "grant" | "proposal"
}
const isGrantProposal = (proposal: GrantDetail | ProposalDetail): proposal is GrantDetail =>
  proposal.type === ProposalType.Grant

export const GrantsProposalCard = ({ proposal, variant = "grant" }: GrantsProposalCardProps) => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()

  const proposalId = proposal.proposalId.toString()
  const { data: userDeposits } = useProposalUserDeposit(proposalId)
  const { data: userVoteEvent } = useUserSingleProposalVoteEvent(proposalId)
  const { supportEndDate, votingEndDate } = proposal.interactionDates
  const router = useRouter()
  const communityDepositPercentage = (proposal.communityDeposits / Number(formatEther(proposal.depositThreshold))) * 100

  const proposalVotes = useMemo(() => {
    const data = proposal.votes
    const totalPower = data.reduce((acc, item) => acc.plus(BigNumber(item.totalPower ?? 0)), BigNumber(0))
    const totalVoters = data.reduce((acc, item) => acc + item.voters, 0)
    const totalWeight = data.reduce((acc, item) => acc.plus(BigNumber(item.totalWeight ?? 0)), BigNumber(0))
    const groupedVotes = data.reduce((acc, item) => {
      const itemWeight = BigNumber(item.totalWeight ?? 0)
      const itemPower = BigNumber(item.totalPower ?? 0)
      // Calculate percentages as (item / total) * 100 using BigNumber math
      const percentage = totalWeight.isGreaterThan(0)
        ? itemWeight.dividedBy(totalWeight).multipliedBy(100).toNumber()
        : 0
      const percentagePower = totalPower.isGreaterThan(0)
        ? itemPower.dividedBy(totalPower).multipliedBy(100).toNumber()
        : 0
      acc[item.support.toLowerCase() as Lowercase<ProposalVotes["support"]>] = {
        totalWeight: BigInt(itemWeight?.toFixed() ?? "0"),
        voters: item.voters,
        percentage,
        percentagePower,
      }
      return acc
    }, {} as GroupedProposalVotes)

    return {
      totalVoters,
      totalPower: BigInt(totalPower?.toFixed() ?? "0"), //Convert to big int without loosing precision
      totalWeight: BigInt(totalWeight?.toFixed() ?? "0"), //Convert to big int without loosing precision
      votes: groupedVotes,
    }
  }, [proposal.votes])

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
    if (!isSupportOrVotingPhase || !endsAt) return null
    return formatTimeLeft(endsAt)
  }, [endsAt, isSupportOrVotingPhase])

  return (
    <Card.Root
      as="button"
      variant="action"
      w="full"
      onClick={() => router.push(`/${variant === "grant" ? "grants" : "proposals"}/${proposalId}`)}>
      <VStack w="full" gap={4} alignItems="flex-start">
        <Heading size={{ base: "lg", lg: "md" }} wordBreak="break-word" flexWrap="wrap">
          {proposal?.metadata?.title || "-"}
        </Heading>

        <Stack
          direction={{ base: "column", md: "row" }}
          w="full"
          textStyle={{ base: "sm", md: "md" }}
          justify={{ base: "flex-start" }}
          gap={{ base: 3, md: 2 }}
          align={{ base: "flex-start", md: "center" }}>
          <HStack
            color="text.subtle"
            gap={{ base: 2, md: 3 }}
            flexWrap={{ base: "wrap", sm: "nowrap" }}
            w={{ base: "full", md: "auto" }}>
            {/* {grantProposal && ( */}
            {/*   <> */}
            {/*     <HStack gap={2} minW="fit-content"> */}
            {/*       <Icon as={B3trIcon} color="actions.primary.default" boxSize={{ base: 4, md: 5 }} /> */}
            {/*       <Text textStyle={{ base: "sm", lg: "md" }} whiteSpace="nowrap"> */}
            {/*         {humanNumber(grantProposal?.grantAmountRequested, grantProposal?.grantAmountRequested, "B3TR")} */}
            {/*       </Text> */}
            {/*       <Text display={{ base: "none", lg: "block" }} textStyle={{ base: "sm", lg: "md" }}> */}
            {/*         {"•"} {grantProposal.type === "dapp" ? "App" : "Tooling"} */}
            {/*       </Text> */}
            {/*     </HStack> */}
            {/*     <Separator orientation="vertical" h="16px" /> */}
            {/*   </> */}
            {/* )} */}
            <HStack minW="fit-content">
              <AddressWithProfilePicture address={proposal.proposer} />
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

        {isMobile ? (
          <VStack w="full" gap={2}>
            <HStack w="full" justifyContent="space-between">
              <GrantsProposalStatusBadge
                state={proposal.state}
                hasUserSupported={hasUserDeposited}
                hasUserVoted={hasUserVoted}
                depositReached={proposal?.depositReached ?? false}
              />
              {isSupportOrVotingPhase && (
                <ProposalCommunityInteractions
                  proposalId={proposalId}
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
              <Text textStyle="xxs" alignSelf="flex-start" color="text.subtle" pl={2}>
                {t("Ends: {{endDate}}", { endDate: timeLeftDisplay })}{" "}
              </Text>
            )}
          </VStack>
        ) : (
          <HStack w="full" justifyContent="space-between">
            <HStack gap={4}>
              <GrantsProposalStatusBadge
                state={proposal.state}
                hasUserSupported={hasUserDeposited}
                hasUserVoted={hasUserVoted}
                depositReached={proposal?.depositReached ?? false}
              />
              {timeLeftDisplay ? (
                <Text textStyle="md" color="text.subtle">
                  {t("Ends: {{endDate}}", {
                    endDate: timeLeftDisplay,
                  })}
                </Text>
              ) : null}
            </HStack>
            <HStack gap={2}>
              <ProposalCommunityInteractions
                proposalId={proposalId}
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
