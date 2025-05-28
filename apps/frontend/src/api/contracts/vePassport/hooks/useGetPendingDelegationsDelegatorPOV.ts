import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts"

const address = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "getPendingDelegations" as const

/**
 * Returns the query key for fetching pending delegations.
 * @param delegator - The delegator address.
 * @returns The query key for fetching pending delegations.
 */
export const getPendingDelegationsQueryKeyDelegatorPOV = (delegator: string) => {
  return getCallClauseQueryKey<typeof abi>({ address, method, args: [delegator ?? "0x"] })
}

/**
 * Hook to get pending delegations from the VeBetterPassport contract.
 * @param delegator - The delegator address.
 * @returns An array of addresses representing delegators with pending delegations for the delegator.
 */
// TODO: check 'incoming' or 'outgoing'
export const useGetPendingDelegationsDelegatorPOV = (delegator?: string | null) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [delegator ?? "0x"],
    queryOptions: {
      enabled: !!delegator,
      select: data => data[0] ?? [],
    },
  })
}
