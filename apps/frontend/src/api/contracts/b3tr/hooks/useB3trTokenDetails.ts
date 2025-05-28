import { getConfig } from "@repo/config"
import { getCallClauseQueryKey, useCallClause } from "@vechain/vechain-kit"
import { B3TR__factory } from "@repo/contracts"
import { ethers } from "ethers"

const abi = B3TR__factory.abi
const address = getConfig().b3trContractAddress
const method = "tokenDetails" as const

export type TokenDetails = {
  name: string
  symbol: string
  decimals: number
  circulatingSupply: string
  totalSupply: string
}

export const getB3TrTokenDetailsQueryKey = () => getCallClauseQueryKey<typeof abi>({ address, method, args: [] })
export const useB3trTokenDetails = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data =>
        ({
          name: data[0],
          symbol: data[1],
          decimals: data[2],
          circulatingSupply: ethers.formatEther(data[3]),
          totalSupply: ethers.formatEther(data[4]),
        }) as TokenDetails,
    },
  })
}
