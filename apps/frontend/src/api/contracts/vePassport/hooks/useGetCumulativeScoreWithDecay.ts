import { useWallet, useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain-kit/vebetterdao-contracts/typechain-types"
import { useCurrentAllocationsRoundId } from "../../xAllocations"

const address = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "getCumulativeScoreWithDecay" as const

/**
 * Returns the query key for fetching the cumulative score with decay.
 * @param user - The user address.
 * @param round - The round number.
 * @returns The query key for fetching the cumulative score with decay.
 */
export const getGetCumulativeScoreWithDecayQueryKey = (user: string, round: number) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [user as `0x${string}`, BigInt(round ?? 0)] })
}

/**
 * Hook to get the cumulative score with decay from the VeBetterPassport contract.
 * @param user - The user address.
 * @param round - The round number.
 * @returns The cumulative score with decay.
 */
export const useGetCumulativeScoreWithDecay = (user?: string | null, round?: number) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(user ?? "0x") as `0x${string}`, BigInt(round ?? 0)],
    queryOptions: {
      enabled: !!user && !!round,
      select: data => data[0],
    },
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
    roundId ? Number(roundId) : undefined,
  )
  return { data: userRoundScore, isLoading: isUserRoundScoreLoading || isRoundIdLoading }
}
