import axios from "axios"
import { convertUriToUrl } from "./uri"

export type NFTMetadata = {
  name: string
  description: string
  image: string
  attributes: {
    trait_type: string
    value: string
  }[]
}

export const getIpfsMetadata = async (uri: string): Promise<NFTMetadata> => {
  const metadata = await axios.get<NFTMetadata>(convertUriToUrl(uri), {
    timeout: 20000,
  })

  return metadata.data
}
