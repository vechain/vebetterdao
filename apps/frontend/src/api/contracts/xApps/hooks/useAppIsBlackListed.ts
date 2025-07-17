import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"

const contractAddress = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "isBlacklisted" as const

export const getAppIsBlackListedQueryKey = (appId: string) => {
  return getCallClauseQueryKeyWithArgs({
    abi,
    address: contractAddress,
    method,
    args: [appId as `0x${string}`],
  })
}

export const useAppIsBlackListed = (appId?: string) => {
  return useCallClause({
    abi,
    address: contractAddress,
    method,
    args: [(appId ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!appId,
      select: data => data[0],
    },
  })
}
