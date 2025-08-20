import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/typechain-types"

const address = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "getPendingDelegations" as const

/**
 * Returns the query key for fetching pending delegations.
 * @param delegatee - The delegatee address.
 * @returns The query key for fetching pending delegations.
 */
export const getPendingDelegationsQueryKeyDelegateePOV = (delegatee: string) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [delegatee as `0x${string}`] })
}

/**
 * Hook to get pending delegations from the VeBetterPassport contract.
 * @param delegatee - The delegatee address.
 * @returns An array of addresses representing delegators with pending delegations for the delegatee.
 */
export const useGetPendingDelegationsDelegateePOV = (delegatee?: string | null) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(delegatee ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!delegatee,
      select: data => data[0],
    },
  })
}
