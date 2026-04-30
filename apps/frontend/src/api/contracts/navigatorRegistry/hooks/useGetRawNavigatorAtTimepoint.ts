import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "getRawNavigatorAtTimepoint" as const

export const getRawNavigatorAtTimepointQueryKey = (citizen: string, timepoint: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [citizen as `0x${string}`, BigInt(timepoint)] })

export const useGetRawNavigatorAtTimepoint = (citizen?: string, timepoint?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(citizen ?? "") as `0x${string}`, BigInt(timepoint ?? "0")],
    queryOptions: {
      enabled: !!citizen && !!timepoint && !!address,
      select: data => (data?.[0] as string) ?? "",
    },
  })
}
