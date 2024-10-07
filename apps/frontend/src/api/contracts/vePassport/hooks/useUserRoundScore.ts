import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useWallet } from "@vechain/dapp-kit-react"
import { useCurrentAllocationsRoundId } from "../../xAllocations"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()

/**
 * Returns the query key for fetching the user round score.
 * @param user - The user address.
 * @param round - The round number.
 * @returns The query key for fetching the user round score.
 */
export const getUserRoundScoreQueryKey = (user: string, round: number) => {
  return getCallKey({ method: "userRoundScore", keyArgs: [user, round] })
}

/**
 * Hook to get the user round score from the VeBetterPassport contract.
 * @param user - The user address.
 * @param round - The round number.
 * @returns The user round score.
 */
export const useUserRoundScore = (user?: string | null, round?: number) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method: "userRoundScore",
    args: [user, round],
    enabled: !!user && !!round,
  })
}

export const useUserCurrentRoundScore = () => {
  const { account } = useWallet()
  const { data: roundId, isLoading: isRoundIdLoading } = useCurrentAllocationsRoundId()
  const { data: userRoundScore, isLoading: isUserRoundScoreLoading } = useUserRoundScore(account, Number(roundId))
  return { data: userRoundScore, isLoading: isUserRoundScoreLoading || isRoundIdLoading }
}
