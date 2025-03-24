import { getConfig } from "@repo/config"
import { useCallback, useMemo } from "react"
import { X2EarnRewardsPool__factory } from "@repo/contracts"
import { useBuildTransaction } from "@/hooks/useBuildTransaction"
import {
  getAppAvailableFundsQueryKey,
  getAppRewardsBalanceQueryKey,
  getAppBalanceQueryKey,
  getIsRewardsPoolEnabledQueryKey,
} from "@/api/contracts/x2EarnRewardsPool"
interface Props {
  xAppId: string
  amount: string
  onSuccess?: () => void
}
import { removingExcessDecimals } from "@/utils/MathUtils"
import { ethers } from "ethers"
import { EnhancedClause } from "@vechain/vechain-kit"

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
    const clauses: EnhancedClause[] = [
      {
        to: X2EARN_REWARDS_POOL_CONTRACT,
        value: 0,
        data: X2EarnRewardsPoolInterface.encodeFunctionData("increaseRewardsPoolBalance", [
          xAppId,
          ethers.parseEther(contractAmount.toString()).toString(),
        ]),
        comment: `Increase ${amount} b3tr to rewards pool balance for xApp ${xAppId}`,
        abi: JSON.parse(JSON.stringify(X2EarnRewardsPoolInterface.getFunction("unpauseDistribution"))),
      },
    ]

    return clauses
  }, [xAppId, amount, contractAmount])

  const buildDecreaseRewardsPoolClause = useCallback(() => {
    const clauses: EnhancedClause[] = [
      {
        to: X2EARN_REWARDS_POOL_CONTRACT,
        value: 0,
        data: X2EarnRewardsPoolInterface.encodeFunctionData("decreaseRewardsPoolBalance", [
          xAppId,
          ethers.parseEther(contractAmount.toString()).toString(),
        ]),
        comment: `Decrease ${amount} b3tr from rewards pool balance for xApp ${xAppId}`,
        abi: JSON.parse(JSON.stringify(X2EarnRewardsPoolInterface.getFunction("decreaseRewardsPoolBalance"))),
      },
    ]

    return clauses
  }, [xAppId, amount, contractAmount])

  const refetchQueryKeys = useMemo(
    () => [
      getAppAvailableFundsQueryKey(xAppId),
      getAppRewardsBalanceQueryKey(xAppId),
      getAppBalanceQueryKey(xAppId),
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
