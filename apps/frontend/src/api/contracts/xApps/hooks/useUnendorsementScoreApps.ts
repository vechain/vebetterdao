import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { UseQueryResult } from "@tanstack/react-query"
import { UnendorsedApp } from "./useUnendorsedApps"

export const getUnendorsedScoreAppsQueryKey = () => {
  getCallKey({ method, keyArgs: [] })
}

const contractAddress = getConfig().x2EarnAppsContractAddress
const contractInterface = X2EarnApps__factory.createInterface()
const method = "getScore"

// Adding to the UnendorsedApp the score of endorsement
export type UnendorsementScoreApp = UnendorsedApp & {
  endorsementScore: number
}

// What is the equivalent of byte32 to string ?
export const useUnendorsementScoreApps = (xAppId?: string): UseQueryResult<UnendorsementScoreApp[], Error> => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [xAppId],
    mapResponse: (res): UnendorsementScoreApp[] =>
      res.decoded[0].map((xApp: any) => ({
        id: xApp[0],
        name: xApp[1],
        metadataURI: xApp[2],
        endorsementScore: xApp[3],
      })),
  })
}
