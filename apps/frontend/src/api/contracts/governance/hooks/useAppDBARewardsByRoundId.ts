import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { DBAPool__factory } from "@vechain/vebetterdao-contracts/factories/DBAPool__factory"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { formatEther } from "viem"

import { useDBADistributionStartRound } from "../../dbaPool/hooks/useDBADistributionStartRound"

const abi = DBAPool__factory.abi
const address = getConfig().dbaPoolContractAddress as `0x${string}`

export const useAppDBARewardsByRoundId = (appId: string, roundIds: number[]) => {
  const thor = useThor()
  const { data: dbaStartRound } = useDBADistributionStartRound()

  return useQuery({
    queryKey: ["appDBARewards", appId, roundIds],
    queryFn: async () => {
      // Only check rounds >= dbaStartRound
      const eligibleRounds = dbaStartRound !== undefined ? roundIds.filter(r => r >= dbaStartRound) : []
      if (eligibleRounds.length === 0) return new Map(roundIds.map(roundId => [roundId, 0]))

      const dbaRoundRewards = await executeMultipleClausesCall({
        thor,
        calls: roundIds.map(
          roundId =>
            ({
              abi,
              address,
              functionName: "dbaRoundRewardsForApp",
              args: [BigInt(roundId), appId as `0x${string}`],
            }) as const,
        ),
      })

      return new Map(dbaRoundRewards.map((reward, idx) => [roundIds[idx], Number(formatEther(reward))]))
    },
    enabled: !!appId && !!thor && dbaStartRound !== undefined && roundIds.length > 0,
  })
}
