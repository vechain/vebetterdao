import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts/factories/GalaxyMember__factory"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "baseURI" as const
/**
 * Query key for the `baseURI` method on the Galaxy Member contract.
 * Using a different name to avoid conflicts with the `baseURI` property on ERC721 contracts.
 */
export const getGMBaseUriQueryKey = () => getCallClauseQueryKey({ abi, address, method })
/**
 * Custom hook that retrieves the base URI for the Galaxy Member NFT.
 *
 * @returns The base URI for the Galaxy Member NFT.
 */
export const useGMBaseUri = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => data[0],
    },
  })
}
