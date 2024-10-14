import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"

const contractInterface = VeBetterPassport__factory.createInterface()
const contractAddress = getConfig().veBetterPassportContractAddress
const method = "thresholdPoPScore"

export const getParticipationScoreThresholdQueryKey = () => {
  return getCallKey({ method, keyArgs: [] })
}

/**
 * Hook to get the participation score threshold from the VeBetterPassport contract
 * @returns the participation score threshold as a number
 */
export const useParticipationScoreThreshold = () => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [],
  })
}
