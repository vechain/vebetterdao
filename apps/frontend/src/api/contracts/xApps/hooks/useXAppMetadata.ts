import { useQuery } from "@tanstack/react-query"
import { useXApp } from "./useXApp"
import { getXAppMetadata } from "../getXAppMetadata"

export const getXAppMetadataQueryKey = (xAppId?: string) => ["xAppMetadata", xAppId]

export const useXAppMetadata = (xAppId?: string) => {
  const { data: xApp } = useXApp(xAppId)

  return useQuery({
    queryKey: getXAppMetadataQueryKey(xAppId),
    queryFn: () => getXAppMetadata(xApp?.metadataURI ?? ""),
    enabled: !!xApp && !!xApp?.metadataURI,
  })
}
