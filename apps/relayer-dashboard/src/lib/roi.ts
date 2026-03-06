import { formatEther } from "viem"

import type { RoundAnalytics } from "./types"

/** ROI for a single round given raw token values and a B3TR→VTHO rate. */
export function computeROI(rewardsRaw: string, vthoSpentRaw: string, b3trToVtho: number | undefined): number | null {
  if (b3trToVtho == null || b3trToVtho <= 0) return null
  const b3tr = Number(formatEther(BigInt(rewardsRaw)))
  const vtho = Number(formatEther(BigInt(vthoSpentRaw)))
  if (vtho === 0) return null
  return ((b3tr * b3trToVtho) / vtho) * 100
}

/** Average of per-round ROIs across multiple rounds. */
export function computeAverageROI(rounds: RoundAnalytics[], b3trToVtho: number | undefined): number | null {
  if (b3trToVtho == null) return null
  const rois = rounds
    .map(r => computeROI(r.totalRelayerRewardsRaw, r.vthoSpentTotalRaw, b3trToVtho))
    .filter((r): r is number => r != null)
  if (rois.length === 0) return null
  return rois.reduce((a, b) => a + b, 0) / rois.length
}

/** Aggregate ROI across all rounds (total rewards / total VTHO). */
export function computeAggregateROI(rounds: RoundAnalytics[], b3trToVtho: number | undefined): number | null {
  if (rounds.length === 0 || b3trToVtho == null || b3trToVtho <= 0) return null
  let totalB3tr = 0
  let totalVtho = 0
  for (const r of rounds) {
    totalB3tr += Number(formatEther(BigInt(r.totalRelayerRewardsRaw)))
    totalVtho += Number(formatEther(BigInt(r.vthoSpentTotalRaw)))
  }
  if (totalVtho === 0) return null
  return ((totalB3tr * b3trToVtho) / totalVtho) * 100
}
