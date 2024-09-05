import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { XApp } from "../getXApps"
import { UseQueryResult } from "@tanstack/react-query"

const contractAddress = getConfig().x2EarnAppsContractAddress
const contractInterface = X2EarnApps__factory.createInterface()
const method = "unendorsedApps"

/**
 * Get the query key for the list of unendorsed apps
 */
export const getUnendorsedAppsQueryKey = () => {
  getCallKey({ method, keyArgs: [] })
}

export type UnendorsedApp = XApp & {
  appAvailableForAllocationVoting: boolean
}
/**
 *  Hook to get the list of unendorsed apps
 * @returns The list of unendorsed apps
 */
export const useUnendorsedApps = (): UseQueryResult<UnendorsedApp[], Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [],
    mapResponse: (res): XApp[] =>
      res.decoded[0].map((xApp: any) => ({
        id: xApp[0],
        teamWalletAddress: xApp[1],
        name: xApp[2],
        metadataURI: xApp[3],
        createdAtTimestamp: xApp[4],
        appAvailableForAllocationVoting: xApp[5],
      })),
  })
}
