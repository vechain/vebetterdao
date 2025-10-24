import { getConfig } from "@repo/config"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { B3TR__factory } from "@vechain/vebetterdao-contracts/factories/B3TR__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { formatEther } from "ethers"

const abi = B3TR__factory.abi
const address = getConfig().b3trContractAddress as `0x${string}`
const method = "balanceOf"
export const getB3trBalanceQueryKey = (userAddress?: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [userAddress as `0x${string}`],
  })
export const useGetB3trBalance = (userAddress?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [userAddress as `0x${string}`],
    queryOptions: {
      enabled: !!userAddress,
      select: data => {
        const original = data[0].toString()
        const scaled = formatEther(original)
        const formatted = scaled === "0" ? "0" : humanNumber(scaled)
        return {
          original,
          scaled,
          formatted,
        }
      },
    },
  })
}
