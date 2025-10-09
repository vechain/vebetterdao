import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@vechain/vebetterdao-contracts"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"

import { removingExcessDecimals } from "../../../../../utils/MathUtils/MathUtils"
import { getAppAvailableFundsQueryKey } from "../getter/useAppAvailableFunds"
import { getAppRewardsBalanceQueryKey } from "../getter/useAppRewardsBalance"
import { getIsRewardsPoolEnabledQueryKey } from "../getter/useIsRewardsPoolEnabled"

import { buildClause } from "@/utils/buildClause"
import { useBuildTransaction } from "@/hooks/useBuildTransaction"

interface Props {
  xAppId: string
  amount: string
  onSuccess?: () => void
}
const X2EarnRewardsPoolInterface = X2EarnRewardsPool__factory.createInterface()
const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress
/** Hook to refill the  rewards pool (increasing or decreasing) balance by amount for a specific xApp
 * @param xAppId the xApp id
 * @param amount the amount of b3tr to decrease the rewards pool balance by
 * @param onSuccess the callback function to run when the transaction is successful
 */
export const useRefillRewardsPool = ({ xAppId, amount, onSuccess }: Props) => {
  const contractAmount = useMemo(() => removingExcessDecimals(amount), [amount])
  const buildIncreaseRewardsPoolClause = useCallback(() => {
    return [
      buildClause({
        to: X2EARN_REWARDS_POOL_CONTRACT,
        contractInterface: X2EarnRewardsPoolInterface,
        method: "increaseRewardsPoolBalance",
        args: [xAppId, ethers.parseEther(contractAmount.toString()).toString()],
        comment: `Increase ${amount} b3tr to rewards pool balance for xApp ${xAppId}`,
      }),
    ]
  }, [xAppId, amount, contractAmount])
  const buildDecreaseRewardsPoolClause = useCallback(() => {
    return [
      buildClause({
        to: X2EARN_REWARDS_POOL_CONTRACT,
        contractInterface: X2EarnRewardsPoolInterface,
        method: "decreaseRewardsPoolBalance",
        args: [xAppId, ethers.parseEther(contractAmount.toString()).toString()],
        comment: `Decrease ${amount} b3tr from rewards pool balance for xApp ${xAppId}`,
      }),
    ]
  }, [xAppId, amount, contractAmount])

  const refetchQueryKeys = useMemo(
    () => [
      getAppAvailableFundsQueryKey(xAppId),
      getAppRewardsBalanceQueryKey(xAppId),
      // TODO: check if this is needed cause hook is not used anywhere
      // getAppBalanceQueryKey(xAppId),
      getIsRewardsPoolEnabledQueryKey(xAppId),
    ],
    [xAppId],
  )

  const increaseRewardsPool = useBuildTransaction({
    clauseBuilder: buildIncreaseRewardsPoolClause,
    refetchQueryKeys,
    onSuccess,
  })

  const decreaseRewardsPool = useBuildTransaction({
    clauseBuilder: buildDecreaseRewardsPoolClause,
    refetchQueryKeys,
    onSuccess,
  })

  return { increaseRewardsPool, decreaseRewardsPool }
}
