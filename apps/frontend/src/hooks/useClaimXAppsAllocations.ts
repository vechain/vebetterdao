import { buildClaimXAppAllocationTx, getB3TrBalanceQueryKey, getHasXAppClaimedQueryKey } from "@/api"
import { useWallet } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import { useCallback, useMemo } from "react"

type useClaimAllocationsProps = {
  roundId: string
  appIds: string[]
  onSuccess?: () => void
  onFailure?: () => void
}

/**
 * Claim allocation rewards for a specific round for multiple xApps
 *
 * @param roundId Id of the round to claim the allocations
 * @param appIds Ids of the xApps to claim the allocations
 * @returns {ClaimAllocationsReturnValue}
 */
export const useClaimXAppsAllocations = ({ roundId, appIds, onSuccess, onFailure }: useClaimAllocationsProps) => {
  const { account } = useWallet()
  const config = getConfig()

  const buildClauses = useCallback(() => {
    const clauses = buildClaimXAppAllocationTx(roundId, appIds)
    return clauses
  }, [appIds, roundId])

  const refetchQueryKeys = useMemo(() => {
    const hasAppClaimedQueryKeys = appIds.map(appId => getHasXAppClaimedQueryKey(roundId, appId))
    const b3TrBalanceQueryKeys = [
      getB3TrBalanceQueryKey(account?.address ?? ""),
      getB3TrBalanceQueryKey(config.x2EarnRewardsPoolContractAddress),
    ]
    return b3TrBalanceQueryKeys.concat(hasAppClaimedQueryKeys)
  }, [appIds, roundId, account?.address, config])

  return useBuildTransaction({
    clauseBuilder: buildClauses,
    refetchQueryKeys,
    onSuccess,
    onFailure,
  })
}
