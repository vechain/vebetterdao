import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { formatEther } from "ethers"
import { VOT3__factory } from "@vechain-kit/vebetterdao-contracts"
import { getConfig } from "@repo/config"
import { humanNumber } from "@repo/utils/FormattingUtils"

const abi = VOT3__factory.abi
const address = getConfig().vot3ContractAddress as `0x${string}`
const method = "balanceOf"

export const getVot3BalanceQueryKey = (userAddress?: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [userAddress as `0x${string}`],
  })

export const useGetVot3Balance = (userAddress?: string) => {
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
