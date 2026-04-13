import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause, useWallet } from "@vechain/vechain-kit"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "getLastReportRound" as const

export const getLastReportRoundQueryKey = (navigator: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [navigator as `0x${string}`] })

export const useGetLastReportRound = (account?: string) => {
  const { account: wallet } = useWallet()
  const addr = account || wallet?.address || ""

  return useCallClause({
    abi,
    address,
    method,
    args: [addr as `0x${string}`],
    queryOptions: {
      enabled: !!addr && !!address,
      select: data => Number(data?.[0] ?? 0),
    },
  })
}
