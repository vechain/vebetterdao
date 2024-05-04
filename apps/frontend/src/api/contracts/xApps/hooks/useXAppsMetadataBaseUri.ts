import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"
import { XApp } from "./useXApps"

/**
 *  Returns the baseUri of the xApps metadata
 * @param thor  the thor client
 * @returns  the baseUri of the xApps metadata
 */
export const getXAppsMetadataBaseUri = async (thor: Connex.Thor): Promise<XApp[]> => {
  const functionFragment = X2EarnApps.createInterface().getFunction("baseURI").format("json")
  const res = await thor.account(X2EARNAPPS_CONTRACT).method(JSON.parse(functionFragment)).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getXAppsMetadataBaseUriQueryKey = () => ["xApps", "metadata", "baseUri"]

/**
 *  Hook to get the baseUri of the xApps metadata
 * @returns the baseUri of the xApps metadata
 */
export const useXAppsMetadataBaseUri = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getXAppsMetadataBaseUriQueryKey(),
    queryFn: async () => await getXAppsMetadataBaseUri(thor),
    enabled: !!thor,
    staleTime: 1000 * 60 * 60, // 1 hour,
  })
}
