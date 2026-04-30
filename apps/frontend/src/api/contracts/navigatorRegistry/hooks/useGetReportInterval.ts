import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "getReportInterval" as const

export const getReportIntervalQueryKey = () => getCallClauseQueryKeyWithArgs({ abi, address, method, args: [] })

export const useGetReportInterval = () =>
  useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      enabled: !!address,
      select: data => Number(data?.[0] ?? 0),
    },
  })
