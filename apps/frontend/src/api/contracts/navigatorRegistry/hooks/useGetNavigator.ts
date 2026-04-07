import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause, useWallet } from "@vechain/vechain-kit"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "getNavigator" as const

export const getGetNavigatorQueryKey = (citizen: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [citizen as `0x${string}`] })

export const useGetNavigator = (citizen?: string) => {
  const { account: wallet } = useWallet()
  const addr = citizen || wallet?.address || ""

  return useCallClause({
    abi,
    address,
    method,
    args: [addr as `0x${string}`],
    queryOptions: {
      enabled: !!addr && !!address,
      select: data => (data?.[0] as string) ?? "",
    },
  })
}
