import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnApps__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress as `0x${string}`
const abi = X2EarnApps__factory.abi
const method = "getUsersEndorsementScore" as const
/**
 * Get the query key the user endorsement score
 */
export const getUserEndorsementScoreQueryKey = (user?: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [(user ?? "0x") as `0x${string}`] })
/**
 *  Hook to get the endorsement score of the user
 * @returns The endorsement score of the user
 */
export const useUserEndorsementScore = (user?: string) => {
  return useCallClause({
    abi,
    address,
    method: "getUsersEndorsementScore",
    args: [(user ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!user,
      select: data => Number(data[0]),
    },
  })
}
