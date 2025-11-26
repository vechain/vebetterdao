import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { useWallet, useThor } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { getParticipatedInGovernanceQueryKey } from "@/api/contracts/galaxyMember/hooks/useParticipatedInGovernance"
import { getXAppRoundEarningsQueryKey } from "@/api/contracts/xAllocationPool/hooks/useXAppRoundEarnings"
import { getAllocationVotersQueryKey } from "@/api/contracts/xAllocations/hooks/useAllocationVoters"
import { getAllocationVotesQueryKey } from "@/api/contracts/xAllocations/hooks/useAllocationVotes"
import { getHasVotedInRoundQueryKey } from "@/api/contracts/xAllocations/hooks/useHasVotedInRound"
import { getIsAutoVotingEnabledQueryKey } from "@/api/contracts/xAllocations/hooks/useIsAutoVotingEnabled"
import { getUserVotingPreferencesQueryKey } from "@/api/contracts/xAllocations/hooks/useUserVotingPreferences"
import { getUserVotesInRoundQueryKey } from "@/api/contracts/xApps/hooks/useUserVotesInRound"
import { getXAppsSharesQueryKey } from "@/api/contracts/xApps/hooks/useXAppShares"
import { TransactionCustomUI } from "@/providers/TransactionModalProvider"

import { useBuildTransaction } from "./useBuildTransaction"

const abi = XAllocationVoting__factory.abi
const address = getConfig().xAllocationVotingContractAddress

type ClausesProps = {
  roundId: string
  appIds: string[]
  voteWeights: bigint[]
  userAddress: string
  hasVoted: boolean
  shouldEnable: boolean
  shouldDisable: boolean
  isAutoVotingEnabledOnChain: boolean
  needsPreferenceUpdate?: boolean
}

type UseManageAutoVotingAndVoteProps = {
  roundId: string
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

/**
 * Hook to manage auto-voting state (enable/disable) and optionally cast vote
 *
 * Handles multiple cases:
 * - Case 1: ENABLING auto-voting (not voted yet)
 *   Clauses: setUserVotingPreferences + toggleAutoVoting
 *   Note: No castVote - relayer will vote for them
 *
 * - Case 2a: ENABLING auto-voting (already voted, preferences changed)
 *   Clauses: setUserVotingPreferences + toggleAutoVoting
 *
 * - Case 2b: ENABLING auto-voting (already voted, preferences unchanged - optimization)
 *   Clauses: toggleAutoVoting only
 *
 * - Case 3: DISABLING auto-voting
 *   Clauses: toggleAutoVoting only
 *   Note: No castVote - user can vote separately if needed
 *
 * @param roundId - The current round ID
 * @param onSuccess - Optional callback to run when transaction succeeds
 * @param transactionModalCustomUI - Optional custom UI for the transaction modal
 * @returns Transaction builder hook with sendTransaction function
 */
export const useEnableAutoVotingAndVote = ({
  roundId,
  onSuccess,
  transactionModalCustomUI,
}: UseManageAutoVotingAndVoteProps) => {
  const { account } = useWallet()
  const thor = useThor()

  const contract = thor.contracts.load(address, abi)

  const clauseBuilder = ({
    roundId,
    appIds,
    voteWeights,
    userAddress,
    hasVoted,
    shouldEnable,
    shouldDisable,
    isAutoVotingEnabledOnChain,
    needsPreferenceUpdate = true,
  }: ClausesProps) => {
    const clauses = []

    // Add vote clause only if:
    // - User hasn't voted yet, AND
    // - Auto-voting is NOT enabled on chain (user is voting manually)
    // When auto-voting is enabled, relayer will vote for them
    if (!hasVoted && !isAutoVotingEnabledOnChain) {
      clauses.push(
        contract.clause.castVote(roundId, appIds, voteWeights, {
          comment: `Cast your vote on round ${roundId}`,
        }).clause,
      )
    }

    // When ENABLING: set preferences first, then toggle
    if (shouldEnable && needsPreferenceUpdate) {
      clauses.push(
        contract.clause.setUserVotingPreferences(appIds, {
          comment: "Set voting preferences for auto-voting",
        }).clause,
      )
    }

    // Only toggle auto-voting if we're actually enabling or disabling
    // (don't toggle if user never had auto-voting enabled and is just voting normally)
    if (shouldEnable || shouldDisable) {
      clauses.push(
        contract.clause.toggleAutoVoting(userAddress, {
          comment: shouldEnable ? "Enable auto-voting" : "Disable auto-voting",
        }).clause,
      )
    }
    return clauses
  }

  const refetchQueryKeys = useMemo(() => {
    return [
      getAllocationVotesQueryKey(roundId),
      getAllocationVotersQueryKey(roundId),
      getXAppsSharesQueryKey(roundId),
      getUserVotesInRoundQueryKey(roundId, account?.address ?? ""),
      getHasVotedInRoundQueryKey(roundId, account?.address ?? undefined),
      getXAppRoundEarningsQueryKey(roundId),
      getParticipatedInGovernanceQueryKey(account?.address ?? ""),
      getIsAutoVotingEnabledQueryKey(account?.address ?? ""),
      getUserVotingPreferencesQueryKey(account?.address ?? ""),
    ]
  }, [roundId, account?.address])

  return useBuildTransaction<ClausesProps>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
  })
}
