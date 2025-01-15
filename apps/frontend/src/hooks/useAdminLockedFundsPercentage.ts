import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@repo/contracts"
import { useCallback, useMemo } from "react"
import { UseSendTransactionReturnValue } from "./useSendTransaction"
import { useBuildTransaction } from "./useBuildTransaction"
import { getAppLockedPercentageQueryKey } from "../api/contracts/x2EarnRewardsPool/hooks/useAppLockedPercentage"
import { getAppAllowanceQueryKey } from "../api/contracts/x2EarnRewardsPool/hooks/useAppAllowance"
import { buildClause } from "@/utils/buildClause"

const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress
const X2EarnRewardsPoolInterface = X2EarnRewardsPool__factory.createInterface()

type Props = {
  appId: string
  percentage?: string
  onSuccess?: () => void
}

/**
 *  Hook to set the locked funds percentage
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useAdminLockedFundsPercentage = ({
  appId,
  percentage,
  onSuccess,
}: Props): UseSendTransactionReturnValue => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: X2EARN_REWARDS_POOL_CONTRACT,
        contractInterface: X2EarnRewardsPoolInterface,
        method: "setLockedFundsPercentage",
        args: [appId, percentage],
        comment: `Admin set locked funds percentage for app ${appId}`,
      }),
    ]
  }, [appId, percentage])

  const refetchQueryKeys = useMemo(
    () => [getAppLockedPercentageQueryKey(appId), getAppAllowanceQueryKey(appId)],
    [appId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
