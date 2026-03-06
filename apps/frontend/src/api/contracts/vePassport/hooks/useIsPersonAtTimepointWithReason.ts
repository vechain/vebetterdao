import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useCallClause } from "@vechain/vechain-kit"

const address = getConfig().veBetterPassportContractAddress as `0x${string}`
const abi = VeBetterPassport__factory.abi
const method = "isPersonAtTimepoint" as const

/**
 * Like useIsPersonAtTimepoint but also returns the reason string from the contract.
 * Reason examples:
 * - "User has delegated their personhood"
 * - "User is blacklisted"
 * - "User has been signaled too many times"
 * - "User does not meet the criteria to be considered a person"
 * - "User's participation score is above the threshold"
 * - "User is whitelisted"
 */
export const useIsPersonAtTimepointWithReason = (user?: string | null, blockNumber?: string | null) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(user ?? "0x") as `0x${string}`, Number(blockNumber ?? 0)],
    queryOptions: {
      enabled: !!user && !!blockNumber,
      select: data => ({ isPerson: data[0] as boolean, reason: data[1] as string }),
    },
  })
}
