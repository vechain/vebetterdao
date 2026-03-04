"use client"

import { Text, Mark } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { useCallClause, useWallet } from "@vechain/vechain-kit"
import { Clock } from "iconoir-react"
import { useMemo } from "react"
import Countdown from "react-countdown"
import { useTranslation } from "react-i18next"

import { useHasVotedInProposals } from "@/api/contracts/governance/hooks/useHasVotedInProposals"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useHasVotedInRound } from "@/api/contracts/xAllocations/hooks/useHasVotedInRound"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { ProposalState } from "@/hooks/proposals/grants/types"
import { useBestBlockCompressed } from "@/hooks/useGetBestBlockCompressed"
import { blockNumberToDate } from "@/utils/date"

import { StatCard } from "./StatCard"

const xAllocationVotingAbi = XAllocationVoting__factory.abi
const xAllocationVotingAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`

export const CountdownBox = () => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { data: [deadlineBlock] = [], isLoading } = useCallClause({
    abi: xAllocationVotingAbi,
    address: xAllocationVotingAddress,
    method: "currentRoundDeadline" as const,
    args: [],
  })
  const { data: bestBlockCompressed, isLoading: iseLoadingBestBlockCompressed } = useBestBlockCompressed()

  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: hasVotedInRound } = useHasVotedInRound(currentRoundId, account?.address)

  const { data: { enrichedProposals } = { enrichedProposals: [] } } = useProposalEnriched()
  const activeProposalIds = useMemo(
    () => enrichedProposals.filter(p => p.state === ProposalState.Active).map(p => p.id),
    [enrichedProposals],
  )
  const { data: proposalVotes } = useHasVotedInProposals(activeProposalIds, account?.address)

  const hasVotedInAllProposals = useMemo(() => {
    if (!activeProposalIds.length) return true
    if (!proposalVotes) return false
    return activeProposalIds.every(id => proposalVotes[id])
  }, [activeProposalIds, proposalVotes])

  const hasCompletedAllVotes = !!hasVotedInRound && hasVotedInAllProposals
  const variant = hasCompletedAllVotes ? "neutral" : "warning"
  const title = hasCompletedAllVotes ? t("Next round starts in") : t("Left to vote")

  return (
    <StatCard
      isLoading={isLoading || iseLoadingBestBlockCompressed}
      variant={variant}
      icon={<Clock />}
      title={title}
      subtitle={
        deadlineBlock ? (
          <Countdown
            now={() => Date.now()}
            date={blockNumberToDate(deadlineBlock, bestBlockCompressed)}
            renderer={({ days, hours, minutes }) => (
              <Text textStyle={{ base: "sm", md: "2xl" }} whiteSpace="nowrap">
                <Mark variant="text" fontWeight="semibold">
                  {days}
                </Mark>
                {"d "}
                <Mark variant="text" fontWeight="semibold">
                  {hours}
                </Mark>
                {"h "}
                <Mark variant="text" fontWeight="semibold">
                  {minutes}
                </Mark>
                {"m "}
              </Text>
            )}
          />
        ) : (
          ""
        )
      }
    />
  )
}
