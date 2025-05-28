import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnCreator__factory } from "@repo/contracts/typechain-types"

const address = getConfig().x2EarnCreatorContractAddress
const abi = X2EarnCreator__factory.abi
const method = "balanceOf" as const

/**
 * Returns the query key for fetching the creator NFT.
 * @returns The query key for fetching the creator NFT.
 */
export const getHasCreatorNFTQueryKey = (walletAddress: string) => {
  return getCallClauseQueryKey<typeof abi>({ address, method, args: [walletAddress] })
}

/**
 * Hook to get the creator NFT from the X2EarnCreator contract.
 * @param walletAddress The wallet address to check for the creator NFT.
 * @returns True if the wallet address has the creator NFT, false otherwise.
 */
export const useHasCreatorNFT = (walletAddress: string) => {
  const { data: balanceData } = useCallClause({
    abi,
    address,
    method,
    args: [walletAddress],
    queryOptions: {
      enabled: !!walletAddress,
      select: data => data[0],
    },
  })
  return (balanceData ?? 0) > 0
}
