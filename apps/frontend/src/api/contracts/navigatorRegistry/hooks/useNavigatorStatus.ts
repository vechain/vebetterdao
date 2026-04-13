import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause, useWallet } from "@vechain/vechain-kit"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "getStatus" as const

export type NavigatorStatusValue = "NONE" | "ACTIVE" | "EXITING" | "DEACTIVATED"

const STATUS_MAP: NavigatorStatusValue[] = ["NONE", "ACTIVE", "EXITING", "DEACTIVATED"]

export const getNavigatorStatusQueryKey = (account: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [account as `0x${string}`] })

export const useNavigatorStatus = (account?: string) => {
  const { account: wallet } = useWallet()
  const addr = account || wallet?.address || ""

  return useCallClause({
    abi,
    address,
    method,
    args: [addr as `0x${string}`],
    queryOptions: {
      enabled: !!addr && !!address,
      select: (data): NavigatorStatusValue => {
        const raw = Number(data?.[0] ?? 0)
        return STATUS_MAP[raw] ?? "NONE"
      },
    },
  })
}
