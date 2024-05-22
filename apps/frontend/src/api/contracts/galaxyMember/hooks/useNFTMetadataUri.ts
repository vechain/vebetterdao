import { useQuery } from "@tanstack/react-query"
import { getConfig } from "@repo/config"
import { useConnex } from "@vechain/dapp-kit-react"
import { GalaxyMember__factory } from "@repo/contracts"

const GALAXY_MEMBER_CONTRACT = getConfig().galaxyMemberContractAddress

export const getNFTMetadataUri = async (thor: Connex.Thor, tokenID: null | string): Promise<string> => {
  if (!tokenID) return Promise.reject(new Error("tokenID not provided"))

  const functionFragment = GalaxyMember__factory.createInterface().getFunction("tokenURI").format("json")
  const res = await thor.account(GALAXY_MEMBER_CONTRACT).method(JSON.parse(functionFragment)).call(tokenID)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return res.decoded[0]
}

export const getNFTMetadataUriQueryKey = (tokenID: null | string) => ["tokenURI", "galaxyMember", tokenID]

/**
 * Get the metadata URI for an NFT
 *
 * @param tokenID the token ID to get the metadata URI for
 * @returns the metadata URI for the token
 */
export const useNFTMetadataUri = (tokenID: null | string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getNFTMetadataUriQueryKey(tokenID),
    queryFn: () => getNFTMetadataUri(thor, tokenID),
    enabled: !!tokenID,
  })
}
