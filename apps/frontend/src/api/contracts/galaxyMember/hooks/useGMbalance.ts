import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts"

const address = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "balanceOf" as const

/**
 * Returns the query key for fetching the GM balance.
 * @param userAddress The user address to get the balance for
 * @returns The query key for fetching the GM balance.
 */
export const getGMbalanceQueryKey = (userAddress?: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [(userAddress || "0x") as `0x${string}`] })

/**
 * Hook to get the number of GM NFTs for an address
 * @param userAddress The address to get the number of GM NFTs owned
 * @returns the number of GM NFTs for the address
 */
export const useGMbalance = (userAddress?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(userAddress || "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!userAddress,
      select: data => data[0],
    },
  })
}
