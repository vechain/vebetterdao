import { Card, Skeleton, VStack } from "@chakra-ui/react"
import React from "react"

import { useActivityFeed } from "@/hooks/activities/useActivityFeed"

import { ActivityCard } from "./ActivityCard"

type Props = {
  roundId?: string
}

const SkeletonCard = () => (
  <Card.Root variant="subtle" rounded="lg" w="full" p="4">
    <Card.Body p="0">
      <VStack gap="3" align="flex-start" w="full">
        <Skeleton height="6" width="24" rounded="full" />
        <VStack gap="1" align="flex-start" w="full">
          <Skeleton height="4" width="60%" />
          <Skeleton height="3" width="40%" />
          <Skeleton height="3" width="20%" />
        </VStack>
      </VStack>
    </Card.Body>
  </Card.Root>
)

export const ActivityFeed: React.FC<Props> = ({ roundId }) => {
  const { data, isLoading } = useActivityFeed(roundId)

  if (isLoading) {
    return (
      <VStack gap="3" w="full">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </VStack>
    )
  }

  if (data.length === 0) return null

  return (
    <VStack gap="3" w="full">
      {data.map((activity, index) => (
        <ActivityCard key={`${activity.type}-${activity.date}-${index}`} activity={activity} />
      ))}
    </VStack>
  )
}
