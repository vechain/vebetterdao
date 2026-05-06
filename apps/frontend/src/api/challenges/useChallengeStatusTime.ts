import { getConfig } from "@repo/config"
import { useCurrentBlock } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { useMemo } from "react"

import { useAllocationsRoundsEvents } from "../contracts/xAllocations/hooks/useAllocationsRoundsEvents"
import { useCurrentAllocationsRoundId } from "../contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

import { ChallengeStatus, ChallengeView } from "./types"

const blockTime = getConfig().network.blockTime

/**
 * Estimates a relevant timestamp for the challenge based on its status:
 * - Pending → estimated start time (from startRound voteStart block)
 * - Active → estimated end time (from endRound voteEnd block)
 * - Completed → estimated end time (from endRound voteEnd block)
 * - Cancelled/Invalid → null
 *
 * Uses known round events when available; extrapolates from the current
 * round's block range for rounds that haven't been created yet.
 */
export const useChallengeStatusTime = (challenge: ChallengeView): dayjs.Dayjs | null => {
  const { data: currentBlock } = useCurrentBlock()
  const { data: roundEvents } = useAllocationsRoundsEvents()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  return useMemo(() => {
    if (challenge.status === ChallengeStatus.Cancelled || challenge.status === ChallengeStatus.Invalid) return null
    if (!currentBlock || !roundEvents?.created.length || !currentRoundId) return null

    const currentRoundEvent = roundEvents.created.find(r => r.roundId === currentRoundId)
    if (!currentRoundEvent) return null

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

    const toTime = (block: number) => dayjs().add((block - currentBlock.number) * blockTime, "milliseconds")

    switch (challenge.status) {
      case ChallengeStatus.Pending:
        return toTime(estimateBlock(challenge.startRound, "start"))
      case ChallengeStatus.Active:
      case ChallengeStatus.Completed:
        return toTime(estimateBlock(challenge.endRound, "end"))
      default:
        return null
    }
  }, [currentBlock, roundEvents, currentRoundId, challenge.status, challenge.startRound, challenge.endRound])
}
