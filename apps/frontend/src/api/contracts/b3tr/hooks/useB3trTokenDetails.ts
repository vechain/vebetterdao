import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { B3trContractJson } from "@repo/contracts"
const b3trAbi = B3trContractJson.abi

const config = getConfig()
const B3TR_CONTRACT = config.b3trContractAddress

export type TokenDetails = {
  name: string
  symbol: string
  decimals: number
  circulatingSupply: string
  totalSupply: string
}

/**
 *  Get the b3tr token details from the contract. circulatingSupply and totalSupply are scaled down to the decimals of the token
 * @param thor
 * @returns  {Promise<{name: string, symbol: string, decimals: number, totalSupply: string}>}
 */

export const getB3trTokenDetails = async (thor: Connex.Thor): Promise<TokenDetails> => {
  const functionAbi = b3trAbi.find(e => e.name === "tokenDetails")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for tokenDetails"))
  const res = await thor.account(B3TR_CONTRACT).method(functionAbi).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  console.log("tokenDetails", res.decoded)
  return {
    name: res.decoded[0],
    symbol: res.decoded[1],
    decimals: res.decoded[2],
    circulatingSupply: FormattingUtils.scaleNumberDown(res.decoded[3], res.decoded[2]),
    totalSupply: FormattingUtils.scaleNumberDown(res.decoded[4], res.decoded[2]),
  }
}

export const getB3TrTokenDetailsQueryKey = () => ["tokenDetails", "b3tr"]
export const useB3trTokenDetails = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getB3TrTokenDetailsQueryKey(),
    queryFn: () => getB3trTokenDetails(thor),
  })
}
