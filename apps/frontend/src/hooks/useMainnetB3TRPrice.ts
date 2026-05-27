import { useQuery } from "@tanstack/react-query"
import { ethers } from "ethers"

/**
 * Always-mainnet B3TR/USD price hook.
 *
 * vechain-kit's `useGetTokenUsdPrice` reads the oracle on whatever network the wallet is
 * connected to — that's empty on local Thor Solo. For UX consistency we want to show a
 * realistic USD figure even when the dev environment is local, so this hook makes a
 * direct HTTP call to the mainnet inspector endpoint regardless of the kit's network.
 */

const MAINNET_NODE = "https://mainnet.vechain.org"
const MAINNET_ORACLE = "0x49eC7192BF804Abc289645ca86F1eD01a6C17713"
// "b3tr-usd" left-padded to bytes32 — matches the kit's PRICE_FEED_IDS.B3TR
const B3TR_PRICE_FEED_ID = "0x623374722d757364000000000000000000000000000000000000000000000000"

const ORACLE_ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "id", type: "bytes32" }],
    name: "getLatestValue",
    outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
] as const
const oracleInterface = new ethers.Interface(ORACLE_ABI as unknown as ethers.InterfaceAbi)

// The oracle stores prices with 12 decimals → divide by 1e12 to get USD per token.
const PRICE_SCALE = 10n ** 12n

type InspectorResponse = ReadonlyArray<{ data: string; reverted: boolean; vmError?: string }>

const fetchMainnetB3trUsdPrice = async (): Promise<number> => {
  const data = oracleInterface.encodeFunctionData("getLatestValue", [B3TR_PRICE_FEED_ID])
  const res = await fetch(`${MAINNET_NODE}/accounts/*`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ clauses: [{ to: MAINNET_ORACLE, value: "0x0", data }] }),
  })
  if (!res.ok) throw new Error(`Mainnet oracle HTTP ${res.status}`)
  const json = (await res.json()) as InspectorResponse
  const first = json[0]
  if (!first || first.reverted) throw new Error(`Mainnet oracle call reverted: ${first?.vmError ?? "unknown"}`)
  const decoded = oracleInterface.decodeFunctionResult("getLatestValue", first.data)
  const value = decoded[0] as bigint
  // Use BigInt division for the scale, then convert the remaining scaled number to a JS number.
  const whole = value / PRICE_SCALE
  const frac = Number(value % PRICE_SCALE) / Number(PRICE_SCALE)
  return Number(whole) + frac
}

/** React Query hook — same shape as `useGetTokenUsdPrice("B3TR")` returns `{ data: number | undefined }`. */
export const useMainnetB3TRPrice = () => {
  return useQuery({
    queryKey: ["MAINNET_B3TR_USD_PRICE"],
    queryFn: fetchMainnetB3trUsdPrice,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}
