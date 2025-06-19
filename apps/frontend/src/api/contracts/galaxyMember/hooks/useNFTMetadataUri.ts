import { useCallClause, getCallClauseQueryKey, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"

const address = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "tokenURI" as const

/**
 * Returns the query key for fetching the NFT metadata URI.
 * @param tokenID The token ID to get the metadata URI for
 * @returns The query key for fetching the NFT metadata URI.
 */
export const getNFTMetadataUriQueryKey = (tokenID?: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address: address, method, args: [BigInt(tokenID || 0)] })

/**
 * Hook to get the metadata URI for an NFT
 * @param tokenID The token ID to get the metadata URI for
 * @returns the metadata URI for the token
 */
export const useNFTMetadataUri = (tokenID?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(tokenID || 0)],
    queryOptions: {
      enabled: !!tokenID,
      select: data => data[0],
    },
  })
}
