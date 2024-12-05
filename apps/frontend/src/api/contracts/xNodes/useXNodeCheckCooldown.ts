import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"

const contractAddress = getConfig().x2EarnAppsContractAddress
const contractInterface = X2EarnApps__factory.createInterface()
const method = "checkCooldown"

export const getNodeCheckCooldownQueryKey = (nodeId: string) => getCallKey({ method, keyArgs: [nodeId] })

export const useXNodeCheckCooldown = (nodeId: string) => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [nodeId],
    enabled: !!nodeId,
  })
}
