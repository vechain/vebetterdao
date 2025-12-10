import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { TransactionCustomUI } from "@/providers/TransactionModalProvider"

import { getVotingRewardsQueryKey } from "../api/contracts/rewards/hooks/useVotingRewards"
import { RoundReward, buildClaimRewardsTx } from "../api/contracts/rewards/utils/buildClaimRewardsTx"
import { useCurrentAllocationsRoundId } from "../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useIsAutoVotingEnabledForRounds } from "../api/contracts/xAllocations/hooks/useIsAutoVotingEnabledForRounds"

import { useBuildTransaction } from "./useBuildTransaction"
import { getB3trBalanceQueryKey } from "./useGetB3trBalance"

type useClaimRewardsProps = {
  roundRewards: RoundReward[]
  onSuccess?: () => void
  onFailure?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}
// const buffer = 1.01
// Derived from mainnet onchain txs https://vechain-foundation.slack.com/archives/C06BLEJE5SA/p1723109024015819?thread_ts=1723106964.183119&cid=C06BLEJE5SA
// const suggestedMaxGas = 70026 * buffer
/**
 * useClaimRewards is a custom hook that claims voting rewards for a given set of rounds.
 * It uses the useSendTransaction hook to send the transaction and the useQueryClient hook to invalidate the queries after the transaction.
 *
 * @param {useClaimRewardsProps} props - The properties for the hook.
 */
export const useClaimRewards = ({
  roundRewards,
  onSuccess,
  onFailure,
  transactionModalCustomUI,
}: useClaimRewardsProps) => {
  const { account } = useWallet()
  const { data: currentRound } = useCurrentAllocationsRoundId()
  const currentRoundId = parseInt(currentRound ?? "0")
  //Make sure we don't go below 0
  const lastRoundId = Math.max(0, currentRoundId - 1)

  const roundIds = useMemo(() => roundRewards.map(round => round.roundId), [roundRewards])
  const { data: autoVotingActiveMap, isLoading: isLoadingAutoVoting } = useIsAutoVotingEnabledForRounds(roundIds)

  const buildClauses = useCallback(() => {
    if (!account?.address) throw new Error("address is required")
    const clauses = buildClaimRewardsTx(roundRewards, account?.address ?? "", autoVotingActiveMap)

    // Prevent sending empty transactions
    if (clauses.length === 0) {
      throw new Error("No rewards available to claim")
    }

    return clauses
  }, [account?.address, roundRewards, autoVotingActiveMap])
  const refetchQueryKeys = useMemo(() => {
    return [
      getVotingRewardsQueryKey(account?.address ?? "", lastRoundId),
      getB3trBalanceQueryKey(account?.address ?? ""),
    ]
  }, [account?.address, lastRoundId])

  const transaction = useBuildTransaction({
    clauseBuilder: buildClauses,
    onSuccess,
    onFailure,
    refetchQueryKeys,
    transactionModalCustomUI,
  })

  return {
    ...transaction,
    isLoadingAutoVoting,
  }
}
