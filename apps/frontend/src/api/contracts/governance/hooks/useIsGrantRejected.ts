import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts/factories/GrantsManager__factory"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"

const abi = GrantsManager__factory.abi
const address = getConfig().grantsManagerContractAddress as `0x${string}`
const method = "isGrantRejected" as const
export const getIsGrantRejectedQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
  })
export const useIsGrantRejected = (proposalId: string, enabled: boolean = false) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
    queryOptions: {
      enabled: !!proposalId && enabled,
      select: res => res[0],
    },
  })
}
