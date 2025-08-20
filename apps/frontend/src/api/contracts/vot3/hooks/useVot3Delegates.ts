import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VOT3__factory } from "@vechain-kit/vebetterdao-contracts"

const address = getConfig().vot3ContractAddress as `0x${string}`
const abi = VOT3__factory.abi
const method = "delegates" as const

/**
 * Returns the query key for fetching vot3 delegates.
 * @param userAddress The address to check the delegates of
 * @returns The query key for fetching vot3 delegates.
 */
export const getVot3DelegatesQueryKey = (userAddress?: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [(userAddress ?? "0x") as `0x${string}`] })

/**
 * Hook to get the address the user has delegated his votes to (if any)
 * @param userAddress The address of the user
 * @returns the address the user has delegated his votes to (if any)
 */
export const useVot3Delegates = (userAddress?: string) => {
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
