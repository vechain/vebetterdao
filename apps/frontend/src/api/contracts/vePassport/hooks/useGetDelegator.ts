import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { ZeroAddress } from "ethers"

const address = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "getDelegator" as const

/**
 * Returns the query key for fetching the delegator.
 * @param delegator - The delegator address.
 * @returns The query key for fetching the delegator.
 */
export const getDelegatorQueryKey = (delegator: string) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [delegator as `0x${string}`] })
}

/**
 * Hook to get the delegator from the VeBetterPassport contract.
 * @param delegator - The delegator address.
 * @returns The address of the delegator for the given delegator address, or null if the delegator has no delegator.
 */
export const useGetDelegator = (delegator?: string | null) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(delegator ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!delegator,
      select: data => {
        if (data[0] === ZeroAddress) return undefined
        return data[0]
      },
    },
  })
}
