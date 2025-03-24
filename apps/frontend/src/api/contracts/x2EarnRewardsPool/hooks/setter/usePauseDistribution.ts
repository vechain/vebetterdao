import { getConfig } from "@repo/config"
import { buildClause } from "@/utils/buildClause"
import { useCallback, useMemo } from "react"
import { X2EarnRewardsPool__factory } from "@repo/contracts"
import { useBuildTransaction } from "@/hooks/useBuildTransaction"
import { getIsDistributionPausedQueryKey } from "@/api/contracts/x2EarnRewardsPool"

/**
 * Pause distribution for a specific xApp
 * @param xAppId the xApp id
 * @param onSuccess the callback function to run when the transaction is successful
 */
interface Props {
  xAppId: string
  onSuccess?: () => void
}

const X2EarnRewardsPoolInterface = X2EarnRewardsPool__factory.createInterface()
const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress

export const usePauseDistribution = ({ xAppId, onSuccess }: Props) => {
  // build the clause and send the transaction
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: X2EARN_REWARDS_POOL_CONTRACT,
        contractInterface: X2EarnRewardsPoolInterface,
        method: "pauseDistribution",
        args: [xAppId],
        comment: `Pause distribution for xApp ${xAppId}`,
      }),
    ]
  }, [xAppId])

  const refetchQueryKeys = useMemo(() => [getIsDistributionPausedQueryKey(xAppId)], [xAppId])

  const result = useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })

  return result
}
