import { getConfig } from "@repo/config"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getHasXAppClaimedQueryKey } from "../../api/contracts/xAllocationPool/hooks/useHasXAppClaimed"
import { buildClaimXAppAllocationTx } from "../../api/contracts/xAllocationPool/utils/buildClaimXAppAllocationTx"
import { useBuildTransaction } from "../useBuildTransaction"

import { getB3trBalanceQueryKey } from "./useGetB3trBalance"

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
      getB3trBalanceQueryKey(account?.address ?? ""),
      getB3trBalanceQueryKey(config.x2EarnRewardsPoolContractAddress),
    ]
    return [...b3TrBalanceQueryKeys, ...hasAppClaimedQueryKeys]
  }, [appIds, roundId, account?.address, config])
  return useBuildTransaction({
    clauseBuilder: buildClauses,
    refetchQueryKeys,
    onSuccess,
    onFailure,
  })
}
