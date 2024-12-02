import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().galaxyMemberContractAddress
const contractInterface = GalaxyMember__factory.createInterface()
const method = "baseURI"

export const getGMBaseUriQueryKey = () => getCallKey({ method, keyArgs: [] })

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
