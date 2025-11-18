import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { useWallet, EnhancedClause } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getParticipatedInGovernanceQueryKey } from "@/api/contracts/galaxyMember/hooks/useParticipatedInGovernance"
import { getXAppRoundEarningsQueryKey } from "@/api/contracts/xAllocationPool/hooks/useXAppRoundEarnings"
import { getAllocationVotersQueryKey } from "@/api/contracts/xAllocations/hooks/useAllocationVoters"
import { getAllocationVotesQueryKey } from "@/api/contracts/xAllocations/hooks/useAllocationVotes"
import { getHasVotedInRoundQueryKey } from "@/api/contracts/xAllocations/hooks/useHasVotedInRound"
import { getUserVotesInRoundQueryKey } from "@/api/contracts/xApps/hooks/useUserVotesInRound"
import { getXAppsSharesQueryKey } from "@/api/contracts/xApps/hooks/useXAppShares"
import { TransactionCustomUI } from "@/providers/TransactionModalProvider"

import { useBuildTransaction } from "./useBuildTransaction"

const XAllocationVotingInterface = XAllocationVoting__factory.createInterface()

type ClausesProps = {
  roundId: string
  appIds: string[]
  voteWeights: bigint[]
  userAddress: string
  hasVoted?: boolean
}

type UseEnableAutoVotingAndVoteProps = {
  roundId: string
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

/**
 * Hook to enable auto-voting with selected app preferences AND cast vote in current round
 * This combines up to three operations:
 * 1. setUserVotingPreferences - to store the selected app IDs for future auto-voting
 * 2. toggleAutoVoting - to enable auto-voting for the user
 * 3. castVote - to cast vote in the current round with calculated weights (only if user hasn't voted yet)
 *
 * @param roundId - The current round ID
 * @param onSuccess - Optional callback to run when transaction succeeds
 * @param transactionModalCustomUI - Optional custom UI for the transaction modal
 * @returns Transaction builder hook with sendTransaction function that accepts ClausesProps including hasVoted flag
 */
export const useEnableAutoVotingAndVote = ({
  roundId,
  onSuccess,
  transactionModalCustomUI,
}: UseEnableAutoVotingAndVoteProps) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(({ roundId, appIds, voteWeights, userAddress, hasVoted }: ClausesProps) => {
    const clauses: EnhancedClause[] = []

    // Set the user's voting preferences for future auto-voting
    clauses.push({
      to: getConfig().xAllocationVotingContractAddress,
      value: 0,
      data: XAllocationVotingInterface.encodeFunctionData("setUserVotingPreferences", [appIds]),
      comment: "Set voting preferences for auto-voting",
      abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("setUserVotingPreferences"))),
    })

    // Toggle auto-voting to enable it
    clauses.push({
      to: getConfig().xAllocationVotingContractAddress,
      value: 0,
      data: XAllocationVotingInterface.encodeFunctionData("toggleAutoVoting", [userAddress]),
      comment: "Enable auto-voting",
      abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("toggleAutoVoting"))),
    })

    // Cast vote for the current round (only if user hasn't voted yet)
    if (!hasVoted) {
      clauses.push({
        to: getConfig().xAllocationVotingContractAddress,
        value: 0,
        data: XAllocationVotingInterface.encodeFunctionData("castVote", [roundId, appIds, voteWeights]),
        comment: `Cast your vote on round ${roundId}`,
        abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("castVote"))),
      })
    }

    return clauses
  }, [])

  const refetchQueryKeys = useMemo(() => {
    return [
      getAllocationVotesQueryKey(roundId),
      getAllocationVotersQueryKey(roundId),
      getXAppsSharesQueryKey(roundId),
      getUserVotesInRoundQueryKey(roundId, account?.address ?? ""),
      getHasVotedInRoundQueryKey(roundId, account?.address ?? undefined),
      getXAppRoundEarningsQueryKey(roundId),
      getParticipatedInGovernanceQueryKey(account?.address ?? ""),
    ]
  }, [roundId, account?.address])

  return useBuildTransaction<ClausesProps>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
  })
}
