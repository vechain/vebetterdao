import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { ZeroAddress } from "ethers"

const address = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "getDelegatee" as const

/**
 * Returns the query key for fetching the delegatee.
 * @param delegator - The delegator address.
 * @returns The query key for fetching the delegatee.
 */
export const getDelegateeQueryKey = (delegator: string) => {
  return getCallClauseQueryKey<typeof abi>({ address, method, args: [delegator ?? "0x"] })
}

/**
 * Hook to get the delegatee from the VeBetterPassport contract.
 * @param delegator - The delegator address.
 * @returns The address of the delegatee for the given delegator, or null if the delegator has no delegatee.
 */
export const useGetDelegatee = (delegator?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [delegator ?? "0x"],
    queryOptions: {
      enabled: !!delegator,
      select: data => {
        if (data[0] === ZeroAddress) return undefined
        return data[0]
      },
    },
  })
}
