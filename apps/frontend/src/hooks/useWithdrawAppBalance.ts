import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@vechain/vebetterdao-contracts"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"

import { getAppAvailableFundsQueryKey } from "../api/contracts/x2EarnRewardsPool/hooks/getter/useAppAvailableFunds"
import { useXApp } from "../api/contracts/xApps/hooks/useXApp"
import { removingExcessDecimals } from "../utils/MathUtils/MathUtils"

import { useBuildTransaction } from "./useBuildTransaction"

import { buildClause } from "@/utils/buildClause"

const config = getConfig()
const X2EarnRewardsPoolInterface = X2EarnRewardsPool__factory.createInterface()
const X2EARN_REWARDS_POOL_CONTRACT = config.x2EarnRewardsPoolContractAddress
type UseWithdrawAppBalanceProps = {
  appId: string
  amount: string
  reason: string
  onSuccess?: () => void
}
/**
 * Custom hook for withdrawing B3TR from the x2Earn rewards pool.
 *
 * @param {Object} props - The hook props.
 * @param {string} props.appId - The ID of the app.
 * @param {string} props.amount - The amount of B3TR to withdraw.
 * @param {string} props.reason - The reason for the withdrawal.
 * @param {Function} [props.onSuccess] - Optional callback function to be called on successful withdrawal.
 * @returns {Object} - The result of the hook.
 */
export const useWithdrawAppBalance = ({ appId, amount, reason, onSuccess }: UseWithdrawAppBalanceProps) => {
  const contractAmount = useMemo(() => removingExcessDecimals(amount), [amount])
  const { data: app } = useXApp(appId)
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        contractInterface: X2EarnRewardsPoolInterface,
        to: X2EARN_REWARDS_POOL_CONTRACT,
        method: "withdraw",
        args: [ethers.parseEther(contractAmount.toString()).toString(), appId, reason],
        comment: `Withdraw ${amount} B3TR from the ${app?.name} rewards pool with reason "${reason}"`,
      }),
    ]
  }, [appId, contractAmount, amount, reason, app])

  const refetchQueryKeys = useMemo(() => [getAppAvailableFundsQueryKey(appId)], [appId])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
