import { useMemo } from "react"

import { useHistorySection } from "@/api/challenges/useChallengeSections"

import { ChallengesGrid } from "./ChallengesGrid"

interface HistoryTabProps {
  viewerAddress?: string
}

export const HistoryTab = ({ viewerAddress }: HistoryTabProps) => {
  const history = useHistorySection(viewerAddress)

  const items = useMemo(() => {
    const seen = new Set<number>()
    return history.items.filter(v => {
      if (seen.has(v.challengeId)) return false
      seen.add(v.challengeId)
      return true
    })
  }, [history.items])

  return (
    <ChallengesGrid
      items={items}
      section={{
        isLoading: history.isLoading,
        hasNextPage: history.hasNextPage,
        isFetchingNextPage: history.isFetchingNextPage,
        fetchNextPage: history.fetchNextPage,
      }}
    />
  )
}
