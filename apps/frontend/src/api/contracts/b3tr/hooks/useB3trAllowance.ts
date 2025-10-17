import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { B3TR__factory } from "@vechain/vebetterdao-contracts/factories/B3TR__factory"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"
import { formatEther } from "ethers"

const abi = B3TR__factory.abi
const address = getConfig().b3trContractAddress
const method = "allowance" as const
export const getB3TrAllowanceQueryKey = (owner?: string, spender?: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [owner as `0x${string}`, spender as `0x${string}`],
  })
export const useB3trAllowance = (owner?: string, spender?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [owner as `0x${string}`, spender as `0x${string}`],
    queryOptions: {
      enabled: !!owner && !!spender,
      select: data => {
        const original = data[0]
        const scaled = formatEther(BigInt(original))
        const formatted = FormattingUtils.humanNumber(scaled)
        return {
          original,
          scaled,
          formatted,
        }
      },
    },
  })
}
