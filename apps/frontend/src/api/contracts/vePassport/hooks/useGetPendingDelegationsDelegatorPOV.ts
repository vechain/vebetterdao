import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts"

const address = getConfig().veBetterPassportContractAddress as `0x${string}`
const abi = VeBetterPassport__factory.abi
const method = "getPendingDelegations" as const

/**
 * Returns the query key for fetching pending delegations.
 * @param delegator - The delegator address.
 * @returns The query key for fetching pending delegations.
 */
export const getPendingDelegationsQueryKeyDelegatorPOV = (delegator: string) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [delegator as `0x${string}`] })
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
    args: [(delegator ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!delegator,
      select: data => (data?.[1] ? data[1] : ""),
    },
  })
}
