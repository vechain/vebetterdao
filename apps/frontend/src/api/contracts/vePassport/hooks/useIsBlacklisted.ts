import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"

const contractAddress = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "isBlacklisted" as const

/**
 * Returns the query key for fetching the IsBlacklisted status.
 * @returns The query key for fetching the IsBlacklisted status.
 */
export const getIsBlacklistedQueryKey = (address?: string) => {
  return getCallClauseQueryKey<typeof abi>({ address: contractAddress, method, args: [address ?? "0x"] })
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
    args: [address ?? "0x"],
    queryOptions: {
      enabled: !!address,
      select: data => data[0],
    },
  })
}
