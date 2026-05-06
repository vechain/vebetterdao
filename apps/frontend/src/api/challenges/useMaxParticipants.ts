import { getConfig } from "@repo/config"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { getCallClauseQueryKey, useCallClause } from "@vechain/vechain-kit"

const address = getConfig().challengesContractAddress
const abi = B3TRChallenges__factory.abi
const method = "maxParticipants" as const
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export const getMaxParticipantsQueryKey = () => getCallClauseQueryKey({ abi, address, method })

/**
 * Hook to get the maximum number of participants allowed in a challenge.
 * @returns the current max participants limit
 */
export const useMaxParticipants = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      enabled: address.toLowerCase() !== ZERO_ADDRESS,
      select: data => Number(data[0] ?? 0n),
    },
  })
}
