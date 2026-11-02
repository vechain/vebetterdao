"use client"

import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { selectNextChallengeStatus } from "@/api/challenges/nextChallengeStatus"
import { ChallengeView } from "@/api/challenges/types"
import {
  useHistorySection,
  useNeededActionsSection,
  useUserChallengesSection,
} from "@/api/challenges/useChallengeSections"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { NextChallengeStatusCard } from "@/app/b3mo-quests/shared/NextChallengeStatusCard"

export const HomeQuestStatusCard = () => {
  const { account } = useWallet()
  if (!account?.address) return null

  return <ConnectedHomeQuestStatusCard viewer={account.address} />
}

const ConnectedHomeQuestStatusCard = ({ viewer }: { viewer: string }) => {
  const { data: currentRoundRaw, isLoading: isRoundLoading } = useCurrentAllocationsRoundId()
  const neededActions = useNeededActionsSection(viewer)
  const userChallenges = useUserChallengesSection(viewer)
  const history = useHistorySection(viewer)
  const currentRound = currentRoundRaw !== undefined ? Number(currentRoundRaw) : undefined

  const status = useMemo(() => {
    if (currentRound === undefined) return null
    const seen = new Set<number>()
    const unique = [...neededActions.items, ...userChallenges.items, ...history.items].filter(
      (challenge: ChallengeView) => {
        if (seen.has(challenge.challengeId)) return false
        seen.add(challenge.challengeId)
        return true
      },
    )
    return selectNextChallengeStatus(unique, currentRound)
  }, [currentRound, history.items, neededActions.items, userChallenges.items])

  return (
    <NextChallengeStatusCard
      status={status}
      isLoading={isRoundLoading || neededActions.isLoading || userChallenges.isLoading || history.isLoading}
    />
  )
}
