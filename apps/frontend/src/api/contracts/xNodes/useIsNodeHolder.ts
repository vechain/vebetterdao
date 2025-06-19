import { useCallClause, getCallClauseQueryKey, ThorClient, executeCallClause } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { NodeManagement__factory } from "@repo/contracts"

const address = getConfig().nodeManagementContractAddress as `0x${string}`
const abi = NodeManagement__factory.abi
const method = "isNodeHolder" as const

/**
 * Returns the query key for checking if an address is a node holder.
 * @param userAddress The address to check
 * @returns The query key for checking if an address is a node holder.
 */
export const getIsNodeHolderQueryKey = (userAddress: string) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [(userAddress ?? "0x") as `0x${string}`] })

export const getIsNodeHolder = async (thor: ThorClient, userAddress: string) => {
  return executeCallClause({
    thor,
    contractAddress: address,
    abi,
    method,
    args: [(userAddress ?? "0x") as `0x${string}`],
  })
}

/**
 * Custom hook that checks if a user is a node holder (either directly or through delegation).
 * @param userAddress The address to check
 * @returns UseQueryResult containing a boolean indicating if the address is a node holder.
 */
export const useIsNodeHolder = (userAddress: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(userAddress ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!userAddress,
      select: data => data[0],
    },
  })
}
