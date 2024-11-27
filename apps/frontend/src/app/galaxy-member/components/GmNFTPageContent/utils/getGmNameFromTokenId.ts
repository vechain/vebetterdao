import { gmNfts } from "@/constants/gmNfts"

export const getGmNameFromTokenId = (gmLevel: number, tokenId?: string) => {
  const nftName = gmNfts[Number(gmLevel) - 1]?.name
  const gmName = `${nftName} #${tokenId}`

  return gmName
}
