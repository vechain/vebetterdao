import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "checkCooldown" as const

export const getNodeCheckCooldownQueryKey = (nodeId: string) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [BigInt(nodeId)] })

export const useXNodeCheckCooldown = (nodeId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(nodeId)],
    queryOptions: {
      enabled: !!nodeId,
      select: data => data[0],
    },
  })
}
