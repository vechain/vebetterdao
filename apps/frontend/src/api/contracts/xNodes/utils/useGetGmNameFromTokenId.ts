import { gmNfts } from "@/constants/gmNfts"
import { useLevelOfToken } from "@/api/contracts/galaxyMember/hooks/useLevelOfToken"

export const useGetGmNameFromTokenId = (tokenId?: string) => {
  const { data: level } = useLevelOfToken(tokenId)

  const nftName = gmNfts[Number(level) - 1]?.name
  const gmName = `${nftName} #${tokenId}`

  return gmName
}
