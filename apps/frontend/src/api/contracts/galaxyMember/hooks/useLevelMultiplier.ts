import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@repo/contracts"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().voterRewardsContractAddress
const abi = VoterRewards__factory.abi
const method = "levelToMultiplier" as const

export const getLevelMultiplierQueryKey = (level?: string) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [BigInt(level || "0")] })

const scaledWeight = (weight: number) => weight / 100

export const useLevelMultiplier = (level?: string, enabled = true) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(level ?? "0")],
    queryOptions: {
      enabled: !!level && enabled,
      select: data => scaledWeight(Number(data[0])),
    },
  })
}
