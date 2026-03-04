import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { useCallClause } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "canUnendorse" as const

export const useCanUnendorse = (nodeId?: string, appId?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(nodeId ?? 0), appId as `0x${string}`],
    queryOptions: {
      enabled: !!nodeId && !!appId,
      select: data => data[0] as boolean,
    },
  })
}
