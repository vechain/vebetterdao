import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useWallet } from "@vechain/vechain-kit"
import { useCurrentAllocationsRoundId } from "../../xAllocations"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()

/**
 * Returns the query key for fetching the cumulative score with decay.
 * @param user - The user address.
 * @param round - The round number.
 * @returns The query key for fetching the cumulative score with decay.
 */
export const getGetCumulativeScoreWithDecayQueryKey = (user: string, round: number) => {
  return getCallKey({ method: "getCumulativeScoreWithDecay", keyArgs: [user, round] })
}

/**
 * Hook to get the cumulative score with decay from the VeBetterPassport contract.
 * @param user - The user address.
 * @param round - The round number.
 * @returns The cumulative score with decay.
 */
export const useGetCumulativeScoreWithDecay = (user?: string | null, round?: number) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method: "getCumulativeScoreWithDecay",
    args: [user, round],
    enabled: !!user && !!round,
  })
}

/**
 * Hook to get the cumulative score with decay for the current user.
 * @returns The cumulative score with decay for the current user.
 */
export const useGetCurrentUserCumulativeScoreWithDecay = () => {
  const { account } = useWallet()
  const { data: roundId, isLoading: isRoundIdLoading } = useCurrentAllocationsRoundId()
  const { data: userRoundScore, isLoading: isUserRoundScoreLoading } = useGetCumulativeScoreWithDecay(
    account?.address,
    Number(roundId),
  )
  return { data: userRoundScore, isLoading: isUserRoundScoreLoading || isRoundIdLoading }
}
