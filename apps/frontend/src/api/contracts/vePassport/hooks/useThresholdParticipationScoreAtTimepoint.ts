import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { formatEther } from "viem"

const address = getConfig().veBetterPassportContractAddress as `0x${string}`
const abi = VeBetterPassport__factory.abi
const method = "thresholdPoPScoreAtTimepoint" as const

/**
 * Returns the query key for fetching the threshold participation score at a specific timepoint.
 * @param blockNumber - The block number at which to get the threshold participation score.
 * @returns The query key for fetching the threshold participation score at a specific timepoint.
 */
export const getThresholdParticipationScoreAtTimepointQueryKey = (blockNumber: string) => {
  return getCallClauseQueryKey<typeof abi>({ address, method, args: [Number(blockNumber)] })
}

/**
 * Hook to get the threshold participation score at a specific timepoint from the VeBetterPassport contract.
 * @param blockNumber - The block number at which to get the threshold participation score.
 * @returns The threshold participation score at a specific timepoint.
 */
export const useThresholdParticipationScoreAtTimepoint = (blockNumber: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [Number(blockNumber)],
    queryOptions: {
      enabled: !!blockNumber,
      select: data => formatEther(BigInt(data[0])),
    },
  })
}
