import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts"
import { executeCallClause, ThorClient } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress as `0x${string}`
const abi = X2EarnApps__factory.abi
const method = "baseURI" as const
/**
 *  Returns the baseUri of the xApps metadata
 * @param thor  the thor client
 * @returns  the baseUri of the xApps metadata
 */
export const getXAppsMetadataBaseUri = async (thor: ThorClient): Promise<string> => {
  const [uri] = await executeCallClause({
    thor,
    abi,
    contractAddress: address,
    method,
    args: [],
  })
  return uri
}
