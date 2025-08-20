import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const abi = VeBetterPassport__factory.abi
const address = getConfig().veBetterPassportContractAddress
const method = "thresholdPoPScore" as const

export const getParticipationScoreThresholdQueryKey = () => getCallClauseQueryKey({ abi, address, method })

/**
 * Hook to get the participation score threshold from the VeBetterPassport contract
 * @returns the participation score threshold as a number
 */
export const useParticipationScoreThreshold = () => {
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
