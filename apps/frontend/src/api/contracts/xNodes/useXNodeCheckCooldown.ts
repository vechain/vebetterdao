import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs, useMultipleClausesCall, useThor } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "checkCooldown" as const

export const getXNodeCheckCooldownQueryKey = (nodeId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(nodeId || 0)] })

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

export const getXNodesCheckCooldownQueryKey = (nodeIds: string[]) => ["XNodes", nodeIds, "CHECK_COOLDOWN"] as string[]

export const useXNodesCheckCooldown = (nodeIds: string[]) => {
  const thor = useThor()
  return useMultipleClausesCall({
    queryKey: getXNodesCheckCooldownQueryKey(nodeIds),
    thor,
    calls: nodeIds.map(
      nodeId =>
        ({
          abi,
          address,
          functionName: method,
          args: [BigInt(nodeId)],
        }) as const,
    ),
  })
}
