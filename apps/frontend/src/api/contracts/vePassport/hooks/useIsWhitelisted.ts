import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain-kit/vebetterdao-contracts/typechain-types"

const contractAddress = getConfig().veBetterPassportContractAddress as `0x${string}`
const abi = VeBetterPassport__factory.abi
const method = "isWhitelisted" as const

/**
 * Returns the query key for fetching the isWhitelisted status.
 * @returns The query key for fetching the isWhitelisted status.
 */
export const getIsWhitelistedQueryKey = (address?: string) => {
  return getCallClauseQueryKeyWithArgs({
    abi,
    address: contractAddress,
    method,
    args: [address as `0x${string}`],
  })
}

/**
 * Hook to get the isWhitelisted status from the VeBetterPassport contract.
 * @param address - The user address.
 * @returns The isWhitelisted status.
 */
export const useIsWhitelisted = (address?: string) => {
  return useCallClause({
    abi,
    address: contractAddress,
    method,
    args: [(address ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!address,
      select: data => data[0],
    },
  })
}
