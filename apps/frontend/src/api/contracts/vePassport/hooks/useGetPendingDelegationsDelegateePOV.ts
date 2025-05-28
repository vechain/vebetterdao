import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"

const address = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "getPendingDelegations" as const

/**
 * Returns the query key for fetching pending delegations.
 * @param delegatee - The delegatee address.
 * @returns The query key for fetching pending delegations.
 */
export const getPendingDelegationsQueryKeyDelegateePOV = (delegatee: string) => {
  return getCallClauseQueryKey<typeof abi>({ address, method, args: [delegatee ?? "0x"] })
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
    args: [delegatee ?? "0x"],
    queryOptions: {
      enabled: !!delegatee,
      select: data => data[0],
    },
  })
}
