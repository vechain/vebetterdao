import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause, useWallet } from "@vechain/vechain-kit"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "hasSetDecision" as const

export const getHasSetDecisionQueryKey = (navigator: string, proposalId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [navigator as `0x${string}`, BigInt(proposalId)] })

export const useHasSetDecision = (proposalId?: string) => {
  const { account } = useWallet()
  const addr = account?.address || ""

  return useCallClause({
    abi,
    address,
    method,
    args: [addr as `0x${string}`, BigInt(proposalId || 0)],
    queryOptions: {
      enabled: !!addr && !!address && !!proposalId,
      select: data => (data?.[0] as boolean) ?? false,
    },
  })
}
