import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnCreator__factory } from "@vechain-kit/vebetterdao-contracts/typechain-types"

const address = getConfig().x2EarnCreatorContractAddress as `0x${string}`
const abi = X2EarnCreator__factory.abi
const method = "balanceOf" as const

/**
 * Returns the query key for fetching the creator NFT.
 * @returns The query key for fetching the creator NFT.
 */
export const getHasCreatorNFTQueryKey = (walletAddress?: string) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [(walletAddress ?? "0x") as `0x${string}`] })
}

/**
 * Hook to get the creator NFT from the X2EarnCreator contract.
 * @param walletAddress The wallet address to check for the creator NFT.
 * @returns True if the wallet address has the creator NFT, false otherwise.
 */
export const useHasCreatorNFT = (walletAddress: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(walletAddress ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!walletAddress,
      select: data => BigInt(data[0]) > 0,
    },
  })
}
