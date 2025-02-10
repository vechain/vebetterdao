import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@repo/contracts"
import { useCallback, useMemo } from "react"
import { UseSendTransactionReturnValue } from "../../../../hooks/useSendTransaction"
import { useBuildTransaction } from "../../../../hooks/useBuildTransaction"
import { getAppAllowanceQueryKey } from "./useAppAllowance"
import { buildClause } from "@/utils/buildClause"
import { ethers } from "ethers"

const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress
const X2EarnRewardsPoolInterface = X2EarnRewardsPool__factory.createInterface()

type Props = {
  appId: string
  amount?: string
  onSuccess?: () => void
}

/**
 *  Hook to set the locked funds percentage
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useSetDistributionAllowance = ({ appId, amount, onSuccess }: Props): UseSendTransactionReturnValue => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: X2EARN_REWARDS_POOL_CONTRACT,
        contractInterface: X2EarnRewardsPoolInterface,
        method: "setDistributionAllowance",
        args: [appId, ethers.parseEther(amount ?? "0").toString()],
        comment: `Admin set distribution allowance for app ${appId}`,
      }),
    ]
  }, [appId, amount])

  // refetch the allowance key, once the tx is done
  const refetchQueryKeys = useMemo(() => [getAppAllowanceQueryKey(appId)], [appId])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
