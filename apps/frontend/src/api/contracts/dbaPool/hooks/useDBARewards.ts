import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { ABIContract } from "@vechain/sdk-core"
import { DBAPool__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useThor } from "@vechain/vechain-kit"
import { formatEther } from "viem"

const abi = DBAPool__factory.abi
const address = getConfig().dbaPoolContractAddress as `0x${string}`

export const getDBARewardsQueryKey = (roundId: string | number, xAppId: string) => [
  "dbaRewards",
  roundId,
  xAppId,
  address,
]

/**
 * Hook to fetch DBA rewards distributed to an app for a specific round
 * Calls dbaRoundRewardsForApp(roundId, appId) on the DBAPool contract
 * @param roundId The round ID to check
 * @param xAppId The app ID to check
 * @returns The amount of DBA rewards distributed to the app (in ether format) or "0" if no rewards
 */
export const useDBARewards = (roundId: string | number, xAppId: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getDBARewardsQueryKey(roundId, xAppId),
    queryFn: async () => {
      try {
        const result = await thor.contracts.executeCall(
          address,
          ABIContract.ofAbi(abi).getFunction("dbaRoundRewardsForApp"),
          [BigInt(roundId), xAppId],
        )

        const amount = (result.result?.array?.[0] as bigint) ?? 0n

        return {
          amount: formatEther(amount),
          appId: xAppId,
          hasRewards: amount > 0n,
        }
      } catch (error) {
        console.error("Error fetching DBA rewards:", error)
        return {
          amount: "0",
          appId: xAppId,
          hasRewards: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    },
    enabled: !!roundId && !!xAppId && !!thor,
  })
}
