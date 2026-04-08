import { HStack, SimpleGrid, Skeleton, Stack, VStack } from "@chakra-ui/react"

import { NavigatorCardSkeleton } from "./NavigatorCardSkeleton"
import { NavigatorStatsCardsSkeleton } from "./NavigatorStatsCardsSkeleton"

export const NavigatorsPageSkeleton = () => (
  <VStack w="full" gap={8} pb={8}>
    {/* Header */}
    <Stack direction={{ base: "column", md: "row" }} w="full" justifyContent="space-between">
      <HStack alignItems="center" w="full" justifyContent="flex-start">
        <Skeleton height={{ base: "8", lg: "10" }} width="40" rounded="md" />
      </HStack>
    </Stack>

    {/* Stats */}
    <NavigatorStatsCardsSkeleton />

    {/* Filters */}
    <Stack direction={{ base: "column", md: "row" }} w="full" gap={3}>
      <Skeleton height="10" maxW={{ base: "full", md: "320px" }} w="full" rounded="xl" />
      <HStack gap={2} flex={1} justify="flex-end">
        <Skeleton height="8" width="36" rounded="xl" />
        <Skeleton height="8" width="32" rounded="xl" />
      </HStack>
    </Stack>

    {/* Card grid */}
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} w="full">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <NavigatorCardSkeleton key={i} />
      ))}
    </SimpleGrid>
  </VStack>
)
