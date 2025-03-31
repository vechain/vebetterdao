import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { UseQueryResult } from "@tanstack/react-query"
import { useAllocationRoundSnapshot, useCurrentAllocationsRoundId } from "@/api"

const contractAddress = getConfig().x2EarnAppsContractAddress
const contractInterface = X2EarnApps__factory.createInterface()
const method = "isEligible"

/**
 * Get the query key for a boolean value indicating if the app was eligible at the start of the current allocation round
 * @param appId  the query key
 */
export const getAppEligibleAtRoundStartQueryKey = (appId: string) => getCallKey({ method, keyArgs: [appId] })

/**
 * Hook to get a boolean value indicating if the app was eligible at the start of the current allocation round
 * @param appId  the app id
 * @returns a boolean value indicating if the app was eligible at the start of the current allocation round
 */
export const useAppEligibleAtRoundStart = (appId: string): UseQueryResult<boolean, Error> => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: roundSnapshot } = useAllocationRoundSnapshot(currentRoundId ?? "")

  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [appId, roundSnapshot],
    enabled: !!appId && !!roundSnapshot,
  })
}
