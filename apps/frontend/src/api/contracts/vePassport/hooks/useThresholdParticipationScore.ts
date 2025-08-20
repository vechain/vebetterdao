import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain-kit/vebetterdao-contracts/typechain-types"

const address = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "thresholdPoPScore" as const

/**
 * Returns the query key for fetching the threshold participation score.
 * @returns The query key for fetching the threshold participation score.
 */
export const getThresholdParticipationScoreQueryKey = () => getCallClauseQueryKey({ abi, address, method })

/**
 * Hook to get the threshold participation score from the VeBetterPassport contract.
 * @returns The threshold participation score.
 */
export const useThresholdParticipationScore = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => Number(data[0]),
    },
  })
}
