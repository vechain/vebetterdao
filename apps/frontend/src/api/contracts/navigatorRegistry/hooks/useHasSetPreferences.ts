import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause, useWallet } from "@vechain/vechain-kit"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "hasSetPreferences" as const

export const getHasSetPreferencesQueryKey = (navigator: string, roundId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [navigator as `0x${string}`, BigInt(roundId)] })

export const useHasSetPreferences = (roundId?: string) => {
  const { account } = useWallet()
  const addr = account?.address || ""

  return useCallClause({
    abi,
    address,
    method,
    args: [addr as `0x${string}`, BigInt(roundId || 0)],
    queryOptions: {
      enabled: !!addr && !!address && !!roundId,
      select: data => (data?.[0] as boolean) ?? false,
    },
  })
}
