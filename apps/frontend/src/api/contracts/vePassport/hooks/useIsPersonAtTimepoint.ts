import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/typechain-types"

const address = getConfig().veBetterPassportContractAddress as `0x${string}`
const abi = VeBetterPassport__factory.abi
const method = "isPersonAtTimepoint" as const

/**
 * Returns the query key for fetching the isPerson status at a given block number.
 * @param user - The user address.
 * @param blockNumber - The block number.
 * @returns The query key for fetching the isPerson status at a given block number.
 */
export const getIsPersonAtTimepointQueryKey = (user: string, blockNumber: string) => {
  return getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [user as `0x${string}`, Number(blockNumber)],
  })
}

/**
 * Hook to get the isPerson status from the VeBetterPassport contract.
 * @param user - The user address.
 * @param blockNumber - The block number.
 * @returns The isPerson status at a given block number.
 */
export const useIsPersonAtTimepoint = (user?: string | null, blockNumber?: string | null) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(user ?? "0x") as `0x${string}`, Number(blockNumber ?? 0)],
    queryOptions: {
      enabled: !!user && !!blockNumber,
      select: data => data[0],
    },
  })
}
