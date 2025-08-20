import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain-kit/vebetterdao-contracts/typechain-types"

const contractAddress = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "isBlacklisted" as const

/**
 * Returns the query key for fetching the IsBlacklisted status.
 * @returns The query key for fetching the IsBlacklisted status.
 */
export const getIsBlacklistedQueryKey = (user: string) => {
  return getCallClauseQueryKeyWithArgs({
    abi,
    address: contractAddress,
    method,
    args: [user as `0x${string}`],
  })
}

/**
 * Hook to get the IsBlacklisted status from the VeBetterPassport contract.
 * @param address - The user address.
 * @returns The IsBlacklisted status.
 */
export const useIsBlacklisted = (address?: string) => {
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
