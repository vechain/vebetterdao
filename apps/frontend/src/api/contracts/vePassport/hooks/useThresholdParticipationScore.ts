import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()
const method = "thresholdParticipationScore"

/**
 * Returns the query key for fetching the threshold participation score.
 * @returns The query key for fetching the threshold participation score.
 */
export const getThresholdParticipationScoreQueryKey = () => {
  return getCallKey({ method, keyArgs: [] })
}

/**
 * Hook to get the threshold participation score from the VeBetterPassport contract.
 * @returns The threshold participation score.
 */
export const useThresholdParticipationScore = () => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method: "thresholdParticipationScore",
    args: [],
  })
}
