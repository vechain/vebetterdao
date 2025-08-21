import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress as `0x${string}`
const abi = X2EarnApps__factory.abi
const method = "creatorApps" as const

/**
 * Returns the number of apps created by the creator
 * @dev note that this should be 1 from x2EarnApps v5, but app submitted before v5 could have more than 1 creator
 * @returns The query key for fetching the number of apps created by the creator
 */
export const getAppsCountFromCreatorQueryKey = (walletAddress?: string) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [(walletAddress ?? "0x") as `0x${string}`] })
}

/**
 * Hook to get the number of apps created by the creator
 * @param walletAddress The wallet address to check for the creator NFT.
 * @returns The number of apps created by the creator
 */
export const useAppsCountFromCreator = (walletAddress: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(walletAddress ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!walletAddress,
      select: data => Number(data[0]),
    },
  })
}
