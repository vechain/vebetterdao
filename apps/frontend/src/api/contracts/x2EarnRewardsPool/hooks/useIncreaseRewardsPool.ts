import { getConfig } from "@repo/config"
import { buildClause } from "@/utils/buildClause"
import { useCallback, useMemo } from "react"
import { X2EarnRewardsPool__factory } from "@repo/contracts"
import { useBuildTransaction } from "@/hooks/useBuildTransaction"
import {
  getAppAvailableFundsQueryKey,
  getAppRewardsBalanceQueryKey,
  getAppBalanceQueryKey,
} from "@/api/contracts/x2EarnRewardsPool"
interface Props {
  xAppId: string
  amount: string
  onSuccess?: () => void
}
import { removingExcessDecimals } from "@/utils/MathUtils"
import { ethers } from "ethers"

const X2EarnRewardsPoolInterface = X2EarnRewardsPool__factory.createInterface()
const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress

/** Hook to increase rewards pool balance by amount for a specific xApp
 * @param xAppId the xApp id
 * @param amount the amount of b3tr to increase the rewards pool balance by
 * @param onSuccess the callback function to run when the transaction is successful
 */
export const useIncreaseRewardsPool = ({ xAppId, amount, onSuccess }: Props) => {
  const contractAmount = useMemo(() => removingExcessDecimals(amount), [amount])

  const clauseBuilder = useCallback(() => {
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

  const refetchQueryKeys = useMemo(
    () => [getAppAvailableFundsQueryKey(xAppId), getAppRewardsBalanceQueryKey(xAppId), getAppBalanceQueryKey(xAppId)],
    [xAppId],
  )

  const result = useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })

  return result
}
