import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "getFeePercentage" as const

export const getGetFeePercentageQueryKey = () => getCallClauseQueryKeyWithArgs({ abi, address, method, args: [] })

/** Returns the navigator fee percentage in basis points (e.g. 2000 = 20%) */
export const useGetFeePercentage = () =>
  useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      enabled: !!address,
      select: data => {
        const raw = Number((data?.[0] as bigint) ?? 0n)
        return { raw, percent: raw / 100 }
      },
    },
  })
