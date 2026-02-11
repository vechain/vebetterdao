import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "maxPointsPerNodePerApp" as const

export const getMaxPointsPerNodePerAppQueryKey = () => getCallClauseQueryKey({ abi, address, method })

export const useMaxPointsPerNodePerApp = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => BigInt(data[0]),
    },
  })
}
