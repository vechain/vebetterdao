import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { useWallet, useThor } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { getParticipatedInGovernanceQueryKey } from "@/api/contracts/galaxyMember/hooks/useParticipatedInGovernance"
import { relayerRewardsPoolAbi } from "@/api/contracts/relayerRewardsPool/abi"
import { getPreferredRelayerQueryKey } from "@/api/contracts/relayerRewardsPool/hooks/usePreferredRelayer"
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
const config = getConfig()
const address = config.xAllocationVotingContractAddress
const relayerPoolAddress = config.relayerRewardsPoolContractAddress

type ClausesProps = {
  roundId: string
  appIds: string[]
  voteWeights: bigint[]
  userAddress: string
  hasVoted: boolean
  shouldEnable: boolean
  shouldDisable: boolean
  isAutoVotingEnabledInCurrentRound: boolean
  needsPreferenceUpdate?: boolean
  preferredRelayerAddress?: string
}

type UseManageAutoVotingAndVoteProps = {
  roundId: string
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

/**
 * Hook to manage auto-voting state (enable/disable) and optionally cast vote
 *
 * Vote casting logic:
 * - Cast vote only if: !hasVoted && !isAutoVotingEnabledInCurrentRound
 * - If isAutoVotingEnabledInCurrentRound is true, relayer handles voting
 *
 * Handles multiple cases:
 * - Case 1: ENABLING auto-voting (InCurrentRound=false, not voted yet)
 *   Clauses: castVote + setUserVotingPreferences + toggleAutoVoting
 *
 * - Case 2: ENABLING auto-voting (InCurrentRound=true OR already voted)
 *   Clauses: setUserVotingPreferences + toggleAutoVoting
 *   Note: No castVote - relayer will vote or already voted
 *
 * - Case 3: DISABLING auto-voting
 *   Clauses: toggleAutoVoting only
 *   Note: No castVote when InCurrentRound=true (relayer handles it)
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
  const relayerPoolContract = thor.contracts.load(relayerPoolAddress, relayerRewardsPoolAbi)

  const clauseBuilder = ({
    roundId,
    appIds,
    voteWeights,
    userAddress,
    hasVoted,
    shouldEnable,
    shouldDisable,
    isAutoVotingEnabledInCurrentRound,
    needsPreferenceUpdate = true,
    preferredRelayerAddress,
  }: ClausesProps) => {
    const clauses = []

    // Add vote clause only if:
    // - User hasn't voted yet, AND
    // - User is NOT registered for auto-voting in current round (relayer won't vote for them)
    // When isAutoVotingEnabledInCurrentRound is true, relayer will vote for them
    if (!hasVoted && !isAutoVotingEnabledInCurrentRound) {
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
          comment: "Set voting preferences for auto-vote",
        }).clause,
      )
    }

    // Only toggle auto-voting if we're actually enabling or disabling
    // (don't toggle if user never had auto-voting enabled and is just voting normally)
    if (shouldEnable || shouldDisable) {
      clauses.push(
        contract.clause.toggleAutoVoting(userAddress, {
          comment: shouldEnable ? "Enable auto-vote" : "Disable auto-vote",
        }).clause,
      )
    }

    // Set preferred relayer (must come after toggleAutoVoting when enabling)
    if (preferredRelayerAddress) {
      clauses.push(
        relayerPoolContract.clause.setPreferredRelayer(preferredRelayerAddress, {
          comment: "Set preferred relayer",
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
      getPreferredRelayerQueryKey(account?.address ?? ""),
    ]
  }, [roundId, account?.address])

  return useBuildTransaction<ClausesProps>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
  })
}
