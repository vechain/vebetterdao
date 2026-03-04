import { Card, HStack, Skeleton, VStack } from "@chakra-ui/react"
import React from "react"

import { ActivityItem } from "@/hooks/activities/types"
import { useActivityFeed } from "@/hooks/activities/useActivityFeed"

import { ActivityCard } from "./ActivityCard"

const getActivityKey = (activity: ActivityItem): string => {
  const base = `${activity.type}-${activity.roundId}-${activity.date}`
  if ("proposalId" in activity.metadata) return `${base}-${activity.metadata.proposalId}`
  if ("apps" in activity.metadata) {
    const apps = activity.metadata.apps as { appId: string }[]
    return `${base}-${apps.map(a => a.appId).join("-")}`
  }
  if ("upgrades" in activity.metadata)
    return `${base}-${activity.metadata.upgrades.map(u => `${u.userAddress}-${u.tokenId}`).join("-")}`
  return base
}

type Props = {
  roundId?: string
}

const SkeletonCard = () => (
  <Card.Root variant="subtle" rounded="lg" w="full" p="4">
    <Card.Body p="0">
      <HStack gap="3" align="flex-start" w="full">
        <Skeleton height="5" width="5" rounded="full" flexShrink={0} />
        <VStack gap="1" align="flex-start" flex="1">
          <Skeleton height="4" width="50%" />
          <Skeleton height="4" width="70%" />
        </VStack>
        <Skeleton height="3" width="16" flexShrink={0} />
      </HStack>
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
      {data.map(activity => (
        <ActivityCard key={getActivityKey(activity)} activity={activity} />
      ))}
    </VStack>
  )
}
