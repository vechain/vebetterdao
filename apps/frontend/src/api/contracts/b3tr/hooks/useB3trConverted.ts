import { FormattingUtils } from "@repo/utils"
import { getCallClauseQueryKey, TokenBalance, useCallClause } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VOT3__factory } from "@repo/contracts/typechain-types"
import { ethers } from "ethers"

const abi = VOT3__factory.abi
const address = getConfig().vot3ContractAddress
const method = "convertedB3trOf" as const

/**
 * Returns a unique query key for the converted balance of a B3TR token.
 *
 * @param {string} [address] - The address to get the query key for.
 *
 * @returns {string[]} The query key.
 */
export const getConvertedB3TRQueryKey = (userAddress?: string) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [userAddress ?? "0x"] })

/**
 * Returns the converted balance of a B3TR token for a given address.
 *
 * @param {string} [address] - The address to get the balance for.
 *
 * @returns {UseQueryResult<TokenBalance, unknown>} The converted balance of the B3TR token.
 */
export const useB3trConverted = (userAddress?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [userAddress ?? "0x"],
    queryOptions: {
      enabled: !!userAddress,
      select: data =>
        ({
          original: data[0].toString(),
          scaled: ethers.formatEther(data[0]),
          formatted: FormattingUtils.humanNumber(ethers.formatEther(data[0])),
        }) as TokenBalance,
    },
  })
}
