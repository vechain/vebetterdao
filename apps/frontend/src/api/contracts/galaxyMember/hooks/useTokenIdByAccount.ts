import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"

const address = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "tokenOfOwnerByIndex" as const

/**
 * Returns the query key for fetching the token ID by account.
 * @param userAddress The user address to get the token ID for
 * @param index The index of the token ID
 * @returns The query key for fetching the token ID by account.
 */
export const getTokenIdByAccountQueryKey = (userAddress: string | null, index: number) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [(userAddress || "0x") as `0x${string}`, BigInt(index)] })

/**
 * Hook to get the token ID for an address given an index
 * @param userAddress The address to get the token ID for
 * @param index The index of the token ID
 * @returns the token ID for the address
 */
export const useTokenIdByAccount = (userAddress: string | null, index: number) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(userAddress || "0x") as `0x${string}`, BigInt(index)],
    queryOptions: {
      enabled: !!userAddress,
      select: data => data[0],
    },
  })
}
