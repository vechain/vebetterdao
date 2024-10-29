import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()
const method = "thresholdPoPScoreAtTimepoint"

/**
 * Returns the query key for fetching the threshold participation score at a specific timepoint.
 * @param blockNumber - The block number at which to get the threshold participation score.
 * @returns The query key for fetching the threshold participation score at a specific timepoint.
 */
export const getThresholdParticipationScoreAtTimepointQueryKey = (blockNumber: string) => {
  return getCallKey({ method, keyArgs: [blockNumber] })
}

/**
 * Hook to get the threshold participation score at a specific timepoint from the VeBetterPassport contract.
 * @param blockNumber - The block number at which to get the threshold participation score.
 * @returns The threshold participation score at a specific timepoint.
 */
export const useThresholdParticipationScoreAtTimepoint = (blockNumber: string) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method: "thresholdPoPScoreAtTimepoint",
    args: [blockNumber],
    enabled: !!blockNumber,
  })
}
