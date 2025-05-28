import { FormattingUtils } from "@repo/utils"
import { getCallClauseQueryKey, useCallClause } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TR__factory } from "@repo/contracts"
import { formatEther } from "ethers"

const abi = B3TR__factory.abi
const address = getConfig().b3trContractAddress
const method = "allowance" as const

export const getB3TrAllowanceQueryKey = (owner?: string, spender?: string) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [owner ?? "0x", spender ?? "0x"] })

export const useB3trAllowance = (owner?: string, spender?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [owner ?? "0x", spender ?? "0x"],
    queryOptions: {
      enabled: !!owner && !!spender,
      select: data => ({
        original: data[0],
        scaled: formatEther(data[0]),
        formatted: FormattingUtils.humanNumber(formatEther(data[0])),
      }),
    },
  })
}
