import { getConfig } from "@repo/config"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { VOT3__factory } from "@vechain/vebetterdao-contracts/factories/VOT3__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { formatEther } from "ethers"

const abi = VOT3__factory.abi
const address = getConfig().vot3ContractAddress as `0x${string}`
const method = "unlockedBalance"

export const getVot3UnlockedBalanceQueryKey = (userAddress?: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [userAddress as `0x${string}`],
  })

export const useGetVot3UnlockedBalance = (userAddress?: string) => {
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
