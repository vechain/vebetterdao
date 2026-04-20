import { ChallengeView, ChallengesHubData, PaginatedChallengeSection } from "@/api/challenges/types"

export type TabId = "active" | "explore" | "history"

const TAB_SECTIONS: Record<TabId, (keyof ChallengesHubData)[]> = {
  active: ["neededActions", "active"],
  explore: ["open", "explore"],
  history: ["history"],
}

const dedupeById = (items: ChallengeView[]): ChallengeView[] => {
  const seen = new Set<number>()
  return items.filter(c => {
    if (seen.has(c.challengeId)) return false
    seen.add(c.challengeId)
    return true
  })
}

export const mergeSectionsForTab = (tab: TabId, data: ChallengesHubData): PaginatedChallengeSection => {
  const keys = TAB_SECTIONS[tab]
  const sections = keys.map(k => data[k])

  return {
    items: dedupeById(sections.flatMap(s => s.items)),
    isLoading: sections.some(s => s.isLoading),
    isFetchingNextPage: sections.some(s => s.isFetchingNextPage),
    hasNextPage: sections.some(s => s.hasNextPage),
    fetchNextPage: async () => {
      await Promise.all(sections.filter(s => s.hasNextPage).map(s => s.fetchNextPage()))
    },
  }
}
