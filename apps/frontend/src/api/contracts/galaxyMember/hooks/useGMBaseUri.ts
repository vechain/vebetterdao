import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().galaxyMemberContractAddress
const contractInterface = GalaxyMember__factory.createInterface()
const method = "baseURI"

/**
 * Query key for the `baseURI` method on the Galaxy Member contract.
 * Using a different name to avoid conflicts with the `baseURI` property on ERC721 contracts.
 */
export const getGMBaseUriQueryKey = () => getCallKey({ method: "getGMBaseUri", keyArgs: [] })

/**
 * Custom hook that retrieves the base URI for the Galaxy Member NFT.
 *
 * @returns The base URI for the Galaxy Member NFT.
 */
export const useGMBaseUri = (): UseQueryResult<string, Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [],
  })
}
