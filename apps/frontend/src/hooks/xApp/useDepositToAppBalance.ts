import { getConfig } from "@repo/config"
import { B3TR__factory } from "@vechain/vebetterdao-contracts/factories/B3TR__factory"
import { X2EarnRewardsPool__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnRewardsPool__factory"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"
import { removingExcessDecimals } from "@/utils/MathUtils/MathUtils"

import { getAppAvailableFundsQueryKey } from "../../api/contracts/x2EarnRewardsPool/hooks/getter/useAppAvailableFunds"
import { useXApp } from "../../api/contracts/xApps/hooks/useXApp"
import { useBuildTransaction } from "../useBuildTransaction"

const config = getConfig()
const X2EarnRewardsPoolInterface = X2EarnRewardsPool__factory.createInterface()
const X2EARN_REWARDS_POOL_CONTRACT = config.x2EarnRewardsPoolContractAddress
const B3TRInterface = B3TR__factory.createInterface()
const B3TR_CONTRACT = config.b3trContractAddress
type UseDepositToAppBalanceProps = {
  appId: string
  amount: string
  onSuccess?: () => void
}
/**
 * Custom hook for depositing B3TR to the x2Earn rewards pool.
 *
 * @param {Object} props - The hook props.
 * @param {string} props.appId - The ID of the app.
 * @param {string} props.amount - The amount of B3TR to deposit.
 * @param {Function} [props.onSuccess] - Optional callback function to be called on successful deposit.
 * @returns {Object} - The result of the hook.
 */
export const useDepositToAppBalance = ({ appId, amount, onSuccess }: UseDepositToAppBalanceProps) => {
  const contractAmount = useMemo(() => removingExcessDecimals(amount), [amount])
  const { data: app } = useXApp(appId)
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        contractInterface: B3TRInterface,
        to: B3TR_CONTRACT,
        method: "approve",
        args: [X2EARN_REWARDS_POOL_CONTRACT, ethers.parseEther(contractAmount.toString()).toString()],
        comment: `Approve to transfer ${amount} B3TR to the ${app?.name} rewards pool`,
      }),
      buildClause({
        contractInterface: X2EarnRewardsPoolInterface,
        to: X2EARN_REWARDS_POOL_CONTRACT,
        method: "deposit",
        args: [ethers.parseEther(contractAmount.toString()).toString(), appId],
        comment: `Deposit ${amount} B3TR to the ${app?.name} rewards pool`,
      }),
    ]
  }, [appId, contractAmount, amount, app])

  const refetchQueryKeys = useMemo(() => [getAppAvailableFundsQueryKey(appId)], [appId])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
