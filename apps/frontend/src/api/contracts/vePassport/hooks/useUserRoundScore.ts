import { useWallet, useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useCurrentAllocationsRoundId } from "../../xAllocations"

const address = getConfig().veBetterPassportContractAddress as `0x${string}`
const abi = VeBetterPassport__factory.abi
const method = "userRoundScore" as const

/**
 * Returns the query key for fetching the user round score.
 * @param user - The user address.
 * @param round - The round number.
 * @returns The query key for fetching the user round score.
 */
export const getUserRoundScoreQueryKey = (user: string, round: number) => {
  return getCallClauseQueryKey<typeof abi>({ address, method, args: [(user ?? "0x") as `0x${string}`, BigInt(round)] })
}

/**
 * Hook to get the user round score from the VeBetterPassport contract.
 * @param user - The user address.
 * @param round - The round number.
 * @returns The user round score.
 */
export const useUserRoundScore = (user?: string | null, round?: number) => {
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
 * Hook to get the user current round score from the VeBetterPassport contract.
 * @returns The user current round score.
 */
export const useUserCurrentRoundScore = () => {
  const { account } = useWallet()
  const { data: roundId, isLoading: isRoundIdLoading } = useCurrentAllocationsRoundId()
  const { data: userRoundScore, isLoading: isUserRoundScoreLoading } = useUserRoundScore(
    account?.address,
    Number(roundId),
  )
  return { data: userRoundScore, isLoading: isUserRoundScoreLoading || isRoundIdLoading }
}
