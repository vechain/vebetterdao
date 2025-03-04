import { getConfig } from "@repo/config"
import { buildClause } from "@/utils/buildClause"
import { useCallback, useMemo } from "react"
import { X2EarnRewardsPool__factory } from "@repo/contracts"
import { useBuildTransaction } from "./useBuildTransaction"
import { getIsRewardsPoolEnabledQueryKey } from "@/api/contracts/x2EarnRewardsPool"

interface Props {
  xAppId: string
  isEnabled: boolean
  onSuccess?: () => void
}
const X2EarnRewardsPoolInterface = X2EarnRewardsPool__factory.createInterface()
const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress

export const useToggleRewardsPool = ({ xAppId, isEnabled, onSuccess }: Props) => {
  // build the clause and send the transaction
  const clauseBuilder = useCallback(() => {
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

  const refetchQueryKeys = useMemo(() => [getIsRewardsPoolEnabledQueryKey(xAppId)], [xAppId])

  const result = useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })

  return result
}
