import { getConfig } from "@repo/config"
import { useCallback, useMemo } from "react"
import { X2EarnRewardsPool__factory } from "@repo/contracts"
import { useBuildTransaction } from "@/hooks/useBuildTransaction"
import {
  getAppRewardsBalanceQueryKey,
  getIsDistributionPausedQueryKey,
  getIsRewardsPoolEnabledQueryKey,
} from "@/api/contracts/x2EarnRewardsPool"
import { EnhancedClause } from "@vechain/vechain-kit"

/**
 * Pause distribution for a specific xApp
 * @param xAppId the xApp id
 * @param onSuccess the callback function to run when the transaction is successful
 */
interface Props {
  xAppId: string
  isEnabled: boolean
  onSuccess?: () => void
}

const X2EarnRewardsPoolInterface = X2EarnRewardsPool__factory.createInterface()
const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress

export const useDistributionManagement = ({ xAppId, onSuccess, isEnabled }: Props) => {
  // build the clause and send the transaction

  const buildPauseClause = useCallback(() => {
    const clauses: EnhancedClause[] = [
      {
        to: X2EARN_REWARDS_POOL_CONTRACT,
        value: 0,
        data: X2EarnRewardsPoolInterface.encodeFunctionData("pauseDistribution", [xAppId]),
        comment: `Pause distribution for xApp ${xAppId}`,
        abi: JSON.parse(JSON.stringify(X2EarnRewardsPoolInterface.getFunction("pauseDistribution"))),
      },
    ]

    return clauses
  }, [xAppId])

  const buildUnpauseClause = useCallback(() => {
    const clauses: EnhancedClause[] = [
      {
        to: X2EARN_REWARDS_POOL_CONTRACT,
        value: 0,
        data: X2EarnRewardsPoolInterface.encodeFunctionData("unpauseDistribution", [xAppId]),
        comment: `Unpause distribution for xApp ${xAppId}`,
        abi: JSON.parse(JSON.stringify(X2EarnRewardsPoolInterface.getFunction("unpauseDistribution"))),
      },
    ]

    return clauses
  }, [xAppId])

  const buildToggleRewardsPoolClause = useCallback(() => {
    const clauses: EnhancedClause[] = [
      {
        to: X2EARN_REWARDS_POOL_CONTRACT,
        value: 0,
        data: X2EarnRewardsPoolInterface.encodeFunctionData("toggleRewardsPoolBalance", [xAppId, isEnabled]),
        comment: `Toggle rewards pool for xApp ${xAppId}`,
        abi: JSON.parse(JSON.stringify(X2EarnRewardsPoolInterface.getFunction("toggleRewardsPoolBalance"))),
      },
    ]

    return clauses
  }, [xAppId, isEnabled])

  const refetchQueryKeys = useMemo(
    () => [
      getIsDistributionPausedQueryKey(xAppId),
      getAppRewardsBalanceQueryKey(xAppId),
      getIsRewardsPoolEnabledQueryKey(xAppId),
    ],
    [xAppId],
  )

  const pauseDistribution = useBuildTransaction({
    clauseBuilder: buildPauseClause,
    refetchQueryKeys,
    onSuccess,
  })

  const unpauseDistribution = useBuildTransaction({
    clauseBuilder: buildUnpauseClause,
    refetchQueryKeys,
    onSuccess,
  })

  const toggleRewardsPool = useBuildTransaction({
    clauseBuilder: buildToggleRewardsPoolClause,
    refetchQueryKeys,
    onSuccess,
  })

  return { pauseDistribution, unpauseDistribution, toggleRewardsPool }
}
