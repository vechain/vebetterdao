import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "getFeeLockPeriod" as const

export const getGetFeeLockPeriodQueryKey = () => getCallClauseQueryKeyWithArgs({ abi, address, method, args: [] })

/** Returns the number of rounds fees are locked before they become claimable */
export const useGetFeeLockPeriod = () =>
  useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      enabled: !!address,
      select: data => Number((data?.[0] as bigint) ?? 0n),
    },
  })
