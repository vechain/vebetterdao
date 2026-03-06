"use client"

import { useGetTokenUsdPrice } from "@vechain/vechain-kit"

/** B3TR to VTHO rate from VeChain oracle (1 B3TR = X VTHO). */
export function useB3trToVthoRate() {
  const { data: b3trUsd } = useGetTokenUsdPrice("B3TR")
  const { data: vthoUsd } = useGetTokenUsdPrice("VTHO")
  if (b3trUsd == null || vthoUsd == null || vthoUsd <= 0) return undefined
  return b3trUsd / vthoUsd
}
