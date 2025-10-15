import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@vechain/vebetterdao-contracts"
import { useCallback, useMemo } from "react"

import { useBuildTransaction } from "@/hooks/useBuildTransaction"
import { buildClause } from "@/utils/buildClause"

import { getAppAvailableFundsQueryKey } from "../getter/useAppAvailableFunds"
import { getAppRewardsBalanceQueryKey } from "../getter/useAppRewardsBalance"
import { getIsDistributionPausedQueryKey } from "../getter/useIsDistributionPaused"
import { getIsRewardsPoolEnabledQueryKey } from "../getter/useIsRewardsPoolEnabled"

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
  const buildUnpauseClause = useCallback(() => {
    return [
      buildClause({
        to: X2EARN_REWARDS_POOL_CONTRACT,
        contractInterface: X2EarnRewardsPoolInterface,
        method: "unpauseDistribution",
        args: [xAppId],
        comment: `Unpause distribution for xApp ${xAppId}`,
      }),
    ]
  }, [xAppId])

  const buildToggleRewardsPoolClause = useCallback(() => {
    return [
      buildClause({
        to: X2EARN_REWARDS_POOL_CONTRACT,
        contractInterface: X2EarnRewardsPoolInterface,
        method: "toggleRewardsPoolBalance",
        args: [xAppId, isEnabled],
        comment: `Toggle rewards pool for xApp ${xAppId}`,
      }),
    ]
  }, [xAppId, isEnabled])

  const refetchQueryKeys = useMemo(
    () => [
      getIsDistributionPausedQueryKey(xAppId),
      getAppRewardsBalanceQueryKey(xAppId),
      getIsRewardsPoolEnabledQueryKey(xAppId),
      getAppAvailableFundsQueryKey(xAppId),
      // TODO: check if this is needed cause hook is not used anywhere
      // getAppBalanceQueryKey(xAppId),
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
