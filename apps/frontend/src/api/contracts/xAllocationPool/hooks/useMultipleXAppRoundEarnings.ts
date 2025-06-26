import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useThor } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@repo/contracts"
import { formatEther } from "viem"
import { useRoundXApps } from "../../xApps/hooks"
import { getXAppRoundEarningsQueryKey } from "./useXAppRoundEarnings"
import { executeMultipleClausesCall } from "@vechain/vechain-kit"

const abi = XAllocationPool__factory.abi
const address = getConfig().xAllocationPoolContractAddress as `0x${string}`
const method = "roundEarnings" as const

export const getMultipleXAppRoundEarningsQueryKey = (roundId: string, xAppIds: string[]) => [
  "roundEarnings",
  "roundId",
  roundId,
  "xAppIds",
  xAppIds,
]

/**
 *  Get the amount of $B3TR every xApp earned from an allocation round
 * @param roundId  the round id
 * @param xAppIds  the xApp ids
 * @returns  the amount of $B3TR every xApp earned from an allocation round
 */
export const useMultipleXAppRoundEarnings = (roundId: string, xAppIds: string[]) => {
  const thor = useThor()
  const queryClient = useQueryClient()
  const { data: xAppsInRound = [] } = useRoundXApps(roundId)

  return useQuery({
    queryKey: getMultipleXAppRoundEarningsQueryKey(roundId, xAppIds),
    queryFn: async () => {
      const res = await executeMultipleClausesCall({
        thor,
        calls: xAppsInRound.map(
          app =>
            ({
              abi,
              functionName: method,
              address,
              args: [BigInt(roundId), app.id as `0x${string}`],
            }) as const,
        ),
      })

      const decoded = res.map((earnings, index) => {
        const parsedAmount = formatEther(earnings[0] || 0n)
        const appId = xAppsInRound[index]?.id as string
        // Update the cache with the new amount
        queryClient.setQueryData(getXAppRoundEarningsQueryKey(roundId, appId), {
          amount: parsedAmount,
          appId,
        })
        return { amount: parsedAmount, appId }
      })

      return decoded
    },
    enabled: !!thor && !!roundId && !!xAppIds.length && !!xAppsInRound.length,
  })
}
