import { NFTStorage } from "nft.storage"

export const NFT_STORAGE_KEY = process.env.NEXT_PUBLIC_NFT_STORAGE_KEY ?? ""
if (!NFT_STORAGE_KEY) throw new Error("NEXT_PUBLIC_NFT_STORAGE_KEY is not set")

export const nftStorageClient = new NFTStorage({
  token: NFT_STORAGE_KEY,
})
