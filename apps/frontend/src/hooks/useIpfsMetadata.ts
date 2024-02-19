import { getIpfsMetadata } from "@/utils/getIpfsMetadata"
import { useQuery } from "@tanstack/react-query"

export const getIpfsMetadataKey = (ipfsUri: null | string) => ["ipfsMetadata", ipfsUri]
export const useIpfsMetadata = (ipfsUri: null | string) => {
  return useQuery({
    queryKey: getIpfsMetadataKey(ipfsUri),
    queryFn: () => getIpfsMetadata(ipfsUri!),
    enabled: !!ipfsUri,
  })
}
