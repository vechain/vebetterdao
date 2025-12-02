import { useQuery } from "@tanstack/react-query"

import { getXAppMetadata } from "../getXAppMetadata"

import { useXApp } from "./useXApp"

export const getXAppMetadataQueryKey = (xAppId?: string) => ["xAppMetadata", xAppId]
export const useXAppMetadata = (xAppId?: string, enabled = true) => {
  const { data: xApp } = useXApp(xAppId)
  return useQuery({
    queryKey: getXAppMetadataQueryKey(xAppId),
    queryFn: () => getXAppMetadata(xApp?.metadataURI ?? ""),
    enabled: enabled && !!xApp && !!xApp?.metadataURI,
  })
}
