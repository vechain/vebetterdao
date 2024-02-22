import { useQueries } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getXAppForecastAmountQueryKey, getXAppForecastedAmount } from "./useXAppForecastedAmount"

/**
 * Fetch the forcasted claimable amoount for ongoing round of multiple xApps
 * @param apps  the xApps
 * @returns  the claimable amoounts
 */
export const useXAppsForecastedAmounts = (apps: string[]) => {
  const { thor } = useConnex()
  return useQueries({
    queries: apps.map(app => ({
      queryKey: getXAppForecastAmountQueryKey(app),
      queryFn: async () => {
        const amount = await getXAppForecastedAmount(thor, app)
        return { amount, app }
      },
    })),
  })
}
