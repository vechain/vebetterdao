import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"

const contractAddress = getConfig().x2EarnAppsContractAddress
const contractAbi = X2EarnApps__factory.abi
const method = "isBlacklisted"

export const getAppIsBlacklistedQueryKey = (appId: string) =>
  getCallClauseQueryKey<typeof contractAbi>({
    address: contractAddress as `0x${string}`,
    method,
    args: [appId as `0x${string}`],
  })

export const useAppIsBlacklisted = (appId: string) => {
  return useCallClause({
    address: contractAddress as `0x${string}`,
    abi: contractAbi,
    method,
    args: [appId as `0x${string}`],
    queryOptions: {
      enabled: !!appId,
    },
  })
}
