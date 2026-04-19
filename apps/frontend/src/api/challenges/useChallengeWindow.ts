import { getConfig } from "@repo/config"
import { useCurrentBlock } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useAllocationsRoundsEvents } from "../contracts/xAllocations/hooks/useAllocationsRoundsEvents"
import { useCurrentAllocationsRoundId } from "../contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

import { ChallengeStatus, ChallengeView } from "./types"

const blockTime = getConfig().network.blockTime

/**
 * Returns the estimated time window (ms epoch) for a challenge's active period.
 * `after` = start of startRound, `before` = end of endRound (capped to now for active challenges).
 * Uses the same block→time estimation as useChallengeStatusTime.
 */
export const useChallengeWindow = (challenge: ChallengeView): { after?: number; before?: number } => {
  const { data: currentBlock } = useCurrentBlock()
  const { data: roundEvents } = useAllocationsRoundsEvents()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  return useMemo(() => {
    if (challenge.status === ChallengeStatus.Cancelled || challenge.status === ChallengeStatus.Invalid)
      return { after: undefined, before: undefined }
    if (!currentBlock || !roundEvents?.created.length || !currentRoundId) return { after: undefined, before: undefined }

    const currentRoundEvent = roundEvents.created.find(r => r.roundId === currentRoundId)
    if (!currentRoundEvent) return { after: undefined, before: undefined }

    const crStart = Number(currentRoundEvent.voteStart)
    const crEnd = Number(currentRoundEvent.voteEnd)
    const blocksPerRound = crEnd - crStart
    const crNum = Number(currentRoundId)

    const estimateBlock = (roundId: number, edge: "start" | "end"): number => {
      const event = roundEvents.created.find(r => r.roundId === String(roundId))
      if (event) return Number(edge === "start" ? event.voteStart : event.voteEnd)
      const diff = roundId - crNum
      return (edge === "start" ? crStart : crEnd) + diff * blocksPerRound
    }

    const toMs = (block: number) => Date.now() + (block - currentBlock.number) * blockTime

    const after = toMs(estimateBlock(challenge.startRound, "start"))
    let before = toMs(estimateBlock(challenge.endRound, "end"))

    if (challenge.status === ChallengeStatus.Active) {
      before = Math.min(before, Date.now())
    }

    return { after, before }
  }, [currentBlock, roundEvents, currentRoundId, challenge.status, challenge.startRound, challenge.endRound])
}
