import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts"
import { useAllocationRoundSnapshot, useCurrentAllocationsRoundId } from "@/api"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "isEligible" as const

/**
 * Get the query key for a boolean value indicating if the app was eligible at the start of the current allocation round
 * @param appId  the query key
 */
export const getAppEligibleAtRoundStartQueryKey = () => getCallClauseQueryKey({ abi, address, method })

/**
 * Hook to get a boolean value indicating if the app was eligible at the start of the current allocation round
 * @param appId  the app id
 * @returns a boolean value indicating if the app was eligible at the start of the current allocation round
 */
export const useAppEligibleAtRoundStart = (appId: string) => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: roundSnapshot } = useAllocationRoundSnapshot(currentRoundId ?? "")

  return useCallClause({
    abi,
    address,
    method,
    args: [appId as `0x${string}`, BigInt(roundSnapshot ?? 0)],
    queryOptions: {
      enabled: !!appId && !!roundSnapshot,
      select: data => data[0],
    },
  })
}
