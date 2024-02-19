import { getIpfsMedia } from "@/utils"
import { useQuery } from "@tanstack/react-query"

export const getIpfsNftImageKey = (imageIpfsUri: null | string) => ["ipfsNftImage", imageIpfsUri]
export const useIpfsNftImage = (imageIpfsUri: null | string) => {
  return useQuery({
    queryKey: getIpfsNftImageKey(imageIpfsUri),
    queryFn: () => getIpfsMedia(imageIpfsUri!),
    enabled: !!imageIpfsUri,
  })
}
