import { Box, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { useCallback, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

import { ChallengeView, PaginatedChallengeSection } from "@/api/challenges/types"

import { ChallengeCard } from "./ChallengeCard"
import { CompactSkeleton } from "./CompactSkeleton"

interface ChallengesGridProps {
  items: ChallengeView[]
  section: Pick<PaginatedChallengeSection, "isLoading" | "hasNextPage" | "isFetchingNextPage" | "fetchNextPage">
}

export const ChallengesGrid = ({ items, section }: ChallengesGridProps) => {
  const { t } = useTranslation()
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && section.hasNextPage && !section.isFetchingNextPage) {
        void section.fetchNextPage()
      }
    },
    [section],
  )

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: "200px" })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleIntersect])

  if (section.isLoading) {
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CompactSkeleton key={i} />
        ))}
      </SimpleGrid>
    )
  }

  if (items.length === 0) {
    return (
      <VStack py="16" gap="2">
        <Text color="text.subtle" textStyle="md">
          {t("No quests to show")}
        </Text>
      </VStack>
    )
  }

  return (
    <>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
        {items.map(c => (
          <ChallengeCard key={c.challengeId} challenge={c} />
        ))}
        {section.isFetchingNextPage && Array.from({ length: 2 }).map((_, i) => <CompactSkeleton key={`skel-${i}`} />)}
      </SimpleGrid>
      <Box ref={sentinelRef} h="1px" />
    </>
  )
}
