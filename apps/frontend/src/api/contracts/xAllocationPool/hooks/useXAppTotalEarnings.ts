import { XAllocationPool__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useThor, executeMultipleClausesCall } from "@vechain/vechain-kit"
import { getXAppRoundEarningsQueryKey } from "./useXAppRoundEarnings"
import { formatEther } from "ethers"

const abi = XAllocationPool__factory.abi
const address = getConfig().xAllocationPoolContractAddress as `0x${string}`
const method = "roundEarnings" as const

export const getXAppTotalEarningsQueryKey = (roundIds: number[], appId: string) => [
  "X_APP_TOTAL_EARNINGS",
  roundIds,
  appId,
]

export const useXAppTotalEarnings = (roundIds: number[], appId: string) => {
  const thor = useThor()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: getXAppTotalEarningsQueryKey(roundIds, appId),
    queryFn: async () => {
      const roundEarnings = await executeMultipleClausesCall({
        thor,
        calls: roundIds.map(
          roundId =>
            ({
              abi,
              functionName: method,
              address,
              args: [BigInt(roundId), appId],
            }) as const,
        ),
      })

      roundEarnings.forEach((earning, index) => {
        queryClient.setQueryData(getXAppRoundEarningsQueryKey(roundIds[index]!, appId), {
          amount: formatEther(earning[0]),
          appId,
        })
      })

      // TODO: migration it will lose precision
      return roundEarnings.reduce((acc, curr) => acc + Number(curr[0]), 0)
    },
  })
}
