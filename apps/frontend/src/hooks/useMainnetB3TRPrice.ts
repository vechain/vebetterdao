import { useQuery } from "@tanstack/react-query"
import { ThorClient, getTokenUsdPrice, getTokenUsdPriceQueryKey } from "@vechain/vechain-kit"

/**
 * Always-mainnet B3TR/USD price hook.
 *
 * vechain-kit's `useGetTokenUsdPrice` reads the oracle on whatever network the wallet is
 * connected to (it calls `useThor()` internally) and offers no override. The oracle isn't
 * deployed on Thor Solo, so on local dev there's no USD figure to show.
 *
 * Workaround: reuse the kit's own `getTokenUsdPrice` function (the non-hook variant) and
 * hand it a `ThorClient` pinned to mainnet. The kit still owns the oracle address, ABI,
 * feed ID and decimal scaling — we just swap the network.
 */

const MAINNET_NODE = "https://mainnet.vechain.org"
const mainnetThor = ThorClient.at(MAINNET_NODE)

/** Same shape as `useGetTokenUsdPrice("B3TR")` — returns `{ data: number | undefined }`. */
export const useMainnetB3TRPrice = () => {
  return useQuery({
    queryKey: ["MAINNET", ...getTokenUsdPriceQueryKey("B3TR")],
    queryFn: () => getTokenUsdPrice(mainnetThor, "B3TR", "main"),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}
