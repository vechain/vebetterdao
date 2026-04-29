import { ethers } from "ethers"
import { LuCheck, LuCircle, LuX } from "react-icons/lu"

import { type ReportRowStatus, type RoundVote } from "./types"

export const SWIPER_BREAKPOINTS = {
  0: { slidesPerView: 1.05, spaceBetween: 12 },
  640: { slidesPerView: 2, spaceBetween: 14 },
  960: { slidesPerView: 2.5, spaceBetween: 16 },
}

export function groupVotesByRound(
  voteEvents: { roundId: string; appsIds: string[]; voteWeights: string[] }[],
  allApps: { id: string; name: string }[] | undefined,
): Map<string, RoundVote> {
  const roundMap = new Map<string, Map<string, number>>()

  for (const event of voteEvents) {
    if (event.appsIds.length !== event.voteWeights.length) continue
    const existing = roundMap.get(event.roundId) ?? new Map<string, number>()
    event.appsIds.forEach((appId, i) => {
      existing.set(appId, (existing.get(appId) ?? 0) + Number(ethers.formatEther(event.voteWeights[i] ?? "0")))
    })
    roundMap.set(event.roundId, existing)
  }

  const result = new Map<string, RoundVote>()
  for (const [roundId, appsMap] of roundMap) {
    result.set(roundId, {
      roundId,
      apps: Array.from(appsMap.entries())
        .sort(([, a], [, b]) => b - a)
        .map(([appId, votes]) => ({
          appId,
          appName: allApps?.find(a => a.id === appId)?.name,
          votes,
        })),
    })
  }
  return result
}

export const statusIcon = (status: ReportRowStatus) => {
  if (status === "done") return <LuCheck />
  if (status === "missed") return <LuX />
  return <LuCircle />
}

export const statusColor = (status: ReportRowStatus) => {
  if (status === "done") return "status.positive.primary"
  if (status === "missed") return "status.negative.primary"
  if (status === "late") return "status.warning.primary"
  if (status === "pending") return "status.info.primary"
  return "text.subtle"
}
