import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { X2EarnCreator__factory } from "@repo/contracts/typechain-types"

const x2EarnCreatorContractAddress = getConfig().x2EarnCreatorContractAddress
const x2EarnCreatorInterface = X2EarnCreator__factory.createInterface()
const method = "balanceOf"

/**
 * Returns the query key for fetching the creator NFT.
 * @returns The query key for fetching the creator NFT.
 */
export const getHasCreatorNFTQueryKey = (walletAddress: string) => {
  return getCallKey({ method, keyArgs: [walletAddress] })
}

/**
 * Hook to get the creator NFT from the X2EarnCreator contract.
 * @param walletAddress The wallet address to check for the creator NFT.
 * @returns True if the wallet address has the creator NFT, false otherwise.
 */
export const useHasCreatorNFT = (walletAddress: string) => {
  const { data: balance } = useCall({
    contractInterface: x2EarnCreatorInterface,
    contractAddress: x2EarnCreatorContractAddress,
    method,
    args: [walletAddress],
    enabled: !!walletAddress,
  })
  return balance > 0
}
