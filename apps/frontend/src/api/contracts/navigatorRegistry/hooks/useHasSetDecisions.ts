import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { executeMultipleClausesCall, useThor, useWallet } from "@vechain/vechain-kit"

const abi = NavigatorRegistry__factory.abi
const address = getConfig().navigatorRegistryContractAddress as `0x${string}`

export const getHasSetDecisionsQueryKey = (navigator: string, proposalIds: string[]) => [
  "navigatorHasSetDecisions",
  navigator,
  proposalIds,
]

export const useHasSetDecisions = (proposalIds: string[]) => {
  const thor = useThor()
  const { account } = useWallet()
  const addr = account?.address ?? ""

  return useQuery({
    queryKey: getHasSetDecisionsQueryKey(addr, proposalIds),
    queryFn: async () => {
      const results = await executeMultipleClausesCall({
        thor,
        calls: proposalIds.map(
          id =>
            ({
              abi,
              address,
              functionName: "hasSetDecision" as const,
              args: [addr as `0x${string}`, BigInt(id)],
            }) as const,
        ),
      })

      return proposalIds.reduce(
        (acc, id, i) => {
          acc[id] = (results[i] as boolean) || false
          return acc
        },
        {} as Record<string, boolean>,
      )
    },
    enabled: !!thor && !!addr && !!address && proposalIds.length > 0,
  })
}
