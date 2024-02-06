import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { TokenDetails } from "../../b3tr"

/**
 *  Get the b3tr token details from the contract. circulatingSupply and totalSupply are scaled down to the decimals of the token
 * @param thor
 * @returns  {Promise<{name: string, symbol: string, decimals: number, totalSupply: string}>}
 */
//TODO: Implement this with contract call
export const getVot3TokenDetails = async (thor: Connex.Thor): Promise<TokenDetails> => {
  // const functionAbi = abi.find(e => e.name === "tokenDetails")
  // if (!functionAbi) return Promise.reject(new Error("Function abi not found for tokenDetails"))
  // const res = await thor.account(VOT3_CONTRACT).method(functionAbi).call()

  // if (res.vmError) return Promise.reject(new Error(res.vmError))

  return {
    name: "VOT3",
    symbol: "VOT3",
    decimals: 18,
    circulatingSupply: "0",
    totalSupply: "0",
  }
}

export const getVot3TokenDetailsQueryKey = () => ["tokenDetails", "vot3"]
export const useVot3TokenDetails = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getVot3TokenDetailsQueryKey(),
    queryFn: () => getVot3TokenDetails(thor),
  })
}
