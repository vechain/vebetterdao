import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/vechain-kit"
import {
  RoundReward,
  buildClaimRewardsTx,
  getB3TrBalanceQueryKey,
  getRoundRewardQueryKey,
  useCurrentAllocationsRoundId,
} from "@/api"
import { useBuildTransaction } from "./useBuildTransaction"
import { TransactionCustomUI } from "@/providers/TransactionModalProvider"

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

  const buildClauses = useCallback(() => {
    if (!account?.address) throw new Error("address is required")

    const clauses = buildClaimRewardsTx(roundRewards, account?.address ?? "")
    return clauses
  }, [account?.address, roundRewards])

  const refetchQueryKeys = useMemo(() => {
    return [
      getRoundRewardQueryKey(`ALL_TO_ROUND_${lastRoundId}`, account?.address ?? undefined),
      getB3TrBalanceQueryKey(account?.address ?? ""),
    ]
  }, [account?.address, lastRoundId])

  return useBuildTransaction({
    clauseBuilder: buildClauses,
    onSuccess,
    onFailure,
    refetchQueryKeys,
    transactionModalCustomUI,
  })
}
