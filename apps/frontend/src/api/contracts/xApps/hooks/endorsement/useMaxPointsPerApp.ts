import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "maxPointsPerApp" as const

export const getMaxPointsPerAppQueryKey = () => getCallClauseQueryKey({ abi, address, method })

export const useMaxPointsPerApp = () => {
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
