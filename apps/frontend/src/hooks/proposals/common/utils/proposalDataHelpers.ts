import { Treasury__factory } from "@vechain/vebetterdao-contracts"
import BigNumber from "bignumber.js"
import { formatEther } from "ethers"
import { getIpfsMetadata } from "@/api/ipfs"

/**
 * Treasury contract interface for decoding transaction data
 */
const treasuryInterface = Treasury__factory.createInterface()

/**
 * Decodes grant amount from treasury transfer calldata
 * @param calldata - The encoded transaction calldata
 * @returns BigNumber representation of the grant amount in ETH
 */
export const getAndDecodeGrantAmount = (calldata?: `0x${string}`) => {
  if (!calldata) return BigNumber(0)

  try {
    const decodedData = treasuryInterface.decodeFunctionData("transferB3TR", calldata)
    const formattedAmount = formatEther(decodedData?.[1]?.toString() ?? "0")
    return BigNumber(formattedAmount)
  } catch (error) {
    console.warn("Error decoding grant amount from calldata:", calldata, error)
    return BigNumber(0)
  }
}

/**
 * Safely fetches IPFS metadata with error handling
 * @param ipfsUri - The IPFS URI to fetch (without ipfs:// prefix)
 * @param parseJson - Whether to parse the result as JSON
 * @returns The fetched metadata or undefined if error occurs
 */
export const safeFetchIpfsMetadata = async <T>(ipfsUri?: string, parseJson = false): Promise<T | undefined> => {
  try {
    if (!ipfsUri) return undefined
    const result = await getIpfsMetadata<T>(`ipfs://${ipfsUri}`, parseJson)
    return result
  } catch (error) {
    console.warn("Error fetching proposal IPFS metadata for", ipfsUri, ":", error)
    return undefined
  }
}
