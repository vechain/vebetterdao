import { FormattingUtils } from "@repo/utils"
import { UseQueryResult, useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { useB3trTokenDetails } from "./useB3trTokenDetails"
import { VOT3__factory } from "@repo/contracts/typechain-types"
import { TokenBalance } from "./useB3trBalance"

const VOT3_CONTRACT = getConfig().vot3ContractAddress

/**
 * Fetches the conveted balance of a B3TR token for a given address.
 *
 * @param {Connex.Thor} thor - The Connex instance.
 * @param {string} [address] - The address to fetch the converted balance for.
 * @param {number} [scaleDecimals=18] - The number of decimals to scale the balance by.
 *
 * @returns {Promise<TokenBalance>} The converted balance of the B3TR token.
 *
 * @throws {Error} If the address is not provided or if there is a VM error.
 */
export const getB3trConverted = async (
  thor: Connex.Thor,
  address?: string,
  scaleDecimals: number = 18,
): Promise<TokenBalance> => {
  if (!address) return Promise.reject(new Error("Address not provided"))

  const functionFragment = VOT3__factory.createInterface().getFunction("convertedB3trOf").format("json")
  const res = await thor.account(VOT3_CONTRACT).method(JSON.parse(functionFragment)).call(address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const original = res.decoded[0]
  const scaled = FormattingUtils.scaleNumberDown(original, scaleDecimals, scaleDecimals)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original,
    scaled,
    formatted,
  }
}

/**
 * Returns a unique query key for the converted balance of a B3TR token.
 *
 * @param {string} [address] - The address to get the query key for.
 *
 * @returns {string[]} The query key.
 */
export const getConvertedB3TRQueryKey = (address?: string) => ["converted", "b3tr", address]

/**
 * Returns the converted balance of a B3TR token for a given address.
 *
 * @param {string} [address] - The address to get the balance for.
 *
 * @returns {UseQueryResult<TokenBalance, unknown>} The converted balance of the B3TR token.
 */
export const useB3trConverted = (address?: string) => {
  const { thor } = useConnex()
  const { data: tokenDetails } = useB3trTokenDetails()

  return useQuery({
    queryKey: getConvertedB3TRQueryKey(address),
    queryFn: () => getB3trConverted(thor, address, tokenDetails?.decimals),
    enabled: !!address && !!tokenDetails?.decimals,
  })
}
