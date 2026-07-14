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
import { NextChallengeStatusCard } from "@/app/b3mo-quests/shared/NextChallengeStatusCard"

export const HomeQuestStatusCard = () => {
  const { account } = useWallet()
  if (!account?.address) return null

  return <ConnectedHomeQuestStatusCard viewer={account.address} />
}

const ConnectedHomeQuestStatusCard = ({ viewer }: { viewer: string }) => {
  const neededActions = useNeededActionsSection(viewer)
  const userChallenges = useUserChallengesSection(viewer)
  const history = useHistorySection(viewer)

  const status = useMemo(() => {
    const seen = new Set<number>()
    const unique = [...neededActions.items, ...userChallenges.items, ...history.items].filter(
      (challenge: ChallengeView) => {
        if (seen.has(challenge.challengeId)) return false
        seen.add(challenge.challengeId)
        return true
      },
    )
    return selectNextChallengeStatus(unique)
  }, [history.items, neededActions.items, userChallenges.items])

  return (
    <NextChallengeStatusCard
      status={status}
      isLoading={neededActions.isLoading || userChallenges.isLoading || history.isLoading}
    />
  )
}
