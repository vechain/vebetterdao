import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause, useWallet } from "@vechain/vechain-kit"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "isNavigator" as const

export const getIsNavigatorQueryKey = (account: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [account as `0x${string}`] })

export const useIsNavigator = (account?: string) => {
  const { account: wallet } = useWallet()
  const addr = account || wallet?.address || ""

  return useCallClause({
    abi,
    address,
    method,
    args: [addr as `0x${string}`],
    queryOptions: {
      enabled: !!addr && !!address,
      select: data => data[0] as boolean,
    },
  })
}
