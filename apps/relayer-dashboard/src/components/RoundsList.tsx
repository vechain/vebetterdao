"use client"

import { Button, Heading, Skeleton, Stack, VStack } from "@chakra-ui/react"
import { useState } from "react"

import { useReportData } from "@/hooks/useReportData"

import { RoundCard } from "./RoundCard"

const PAGE_SIZE = 10

export function RoundsList() {
  const { data: report, isLoading, error } = useReportData()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  if (error) {
    return null
  }

  if (isLoading || !report) {
    return (
      <VStack gap="3" align="stretch">
        <Skeleton height="16" rounded="xl" />
        <Skeleton height="16" rounded="xl" />
        <Skeleton height="16" rounded="xl" />
      </VStack>
    )
  }

  const rounds = [...report.rounds].sort((a, b) => b.roundId - a.roundId)
  const visible = rounds.slice(0, visibleCount)
  const hasMore = visibleCount < rounds.length

  return (
    <VStack gap="4" align="stretch">
      <Heading size="lg">{"Rounds"}</Heading>
      <Stack gap="3">
        {visible.map((round, i) => (
          <RoundCard key={round.roundId} round={round} defaultOpen={i === 0} />
        ))}
      </Stack>
      {hasMore && (
        <Button
          variant="outline"
          size="sm"
          alignSelf="center"
          onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}>
          {"Load more rounds"}
        </Button>
      )}
    </VStack>
  )
}
