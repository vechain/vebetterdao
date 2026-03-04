import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts/factories/GalaxyMember__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "getB3TRtoUpgradeToLevel" as const

export const getB3TRtoUpgradeToLevelQueryKey = (level?: number) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(level ?? 0)] })

export const useGetB3TRtoUpgradeToLevel = (level?: number, enabled = true) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(level ?? 0)],
    queryOptions: {
      enabled: level != null && level > 0 && enabled,
      select: data => data[0],
    },
  })
}
