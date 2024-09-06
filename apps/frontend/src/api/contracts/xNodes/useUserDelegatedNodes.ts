import { getConfig } from "@repo/config"
import { NodeManagement__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().nodeManagementContractAddress
const contractInterface = NodeManagement__factory.createInterface()
const method = "getNodeIds"

/**
 * Get the query key for the list of delegated nodes for a user
 */
export const getUserDelegatedNodes = (user?: string | null) => {
  getCallKey({ method, keyArgs: [user] })
}

/**
 *  Hook to get the list of delegated nodes for a user
 * @returns The delegated nodes for a user
 */
export const useUserDelegatedNodes = (user?: string | null): UseQueryResult<string[], Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [user],
    enabled: !!user,
  })
}
