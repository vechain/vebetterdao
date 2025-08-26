import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().voterRewardsContractAddress
const abi = VoterRewards__factory.abi
const method = "levelToMultiplier" as const

export const getLevelMultiplierQueryKey = (level?: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(level || "0")] })

export const useLevelMultiplier = (level?: string, enabled = true) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(level ?? "0")],
    queryOptions: {
      enabled: !!level && enabled,
      select: data => Number(data[0] || 0) / 100,
    },
  })
}
