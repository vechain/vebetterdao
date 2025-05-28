import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { NodeManagement__factory } from "@repo/contracts"

const address = getConfig().nodeManagementContractAddress
const abi = NodeManagement__factory.abi
const method = "isNodeHolder" as const

/**
 * Returns the query key for checking if an address is a node holder.
 * @param userAddress The address to check
 * @returns The query key for checking if an address is a node holder.
 */
export const getIsNodeHolderQueryKey = (userAddress: string) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [userAddress] })

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
    args: [userAddress],
    queryOptions: {
      enabled: !!userAddress,
      select: data => Boolean(data[0]),
    },
  })
}
