"use client"

import { Card, Grid, HStack, SimpleGrid, Skeleton, VStack } from "@chakra-ui/react"

export function RoundDetailSkeleton() {
  return (
    <VStack w="full" gap="4" align="stretch">
      {/* Header */}
      <VStack align="stretch" gap="2">
        <Skeleton height="5" width="28" rounded="sm" />
        <HStack justify="space-between" w="full">
          <HStack gap="3">
            <Skeleton height="8" width="36" rounded="md" />
            <Skeleton height="5.5" width="16" rounded="full" />
          </HStack>
          <HStack gap="2">
            <Skeleton height="10" width="10" rounded="lg" />
            <Skeleton height="10" width="10" rounded="lg" />
          </HStack>
        </HStack>
      </VStack>

      {/* Content Grid */}
      <Grid templateColumns={{ base: "1fr", lg: "2fr 3fr" }} gap="4" alignItems="start">
        {/* Left Column */}
        <VStack gap="4" align="stretch">
          <Card.Root variant="primary">
            <Card.Body>
              <VStack gap="4" align="stretch">
                <Skeleton height="4" width="28" rounded="sm" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <HStack key={i} justify="space-between">
                    <Skeleton height="4" width="24" rounded="sm" />
                    <Skeleton height="4" width="16" rounded="sm" />
                  </HStack>
                ))}
                <Skeleton height="3" width="full" rounded="full" />
                <Skeleton height="3" width="32" rounded="sm" />
              </VStack>
            </Card.Body>
          </Card.Root>
          <SimpleGrid columns={2} gap="4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card.Root key={i} variant="primary" p="4">
                <VStack gap="1" align="start">
                  <Skeleton height="3" width="16" rounded="sm" />
                  <Skeleton height="8" width="20" rounded="md" />
                </VStack>
              </Card.Root>
            ))}
          </SimpleGrid>
        </VStack>

        {/* Right Column */}
        <VStack gap="4" align="stretch">
          <Card.Root variant="primary">
            <Card.Body>
              <VStack gap="4" align="stretch">
                <Skeleton height="4" width="40" rounded="sm" />
                <SimpleGrid columns={2} gap="4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <VStack key={i} gap="1" align="start">
                      <Skeleton height="3" width="24" rounded="sm" />
                      <Skeleton height="3" width="20" rounded="sm" />
                      <Skeleton height="7" width="16" rounded="md" />
                    </VStack>
                  ))}
                </SimpleGrid>
              </VStack>
            </Card.Body>
          </Card.Root>
          <Card.Root variant="primary">
            <Card.Body>
              <VStack gap="3" align="stretch">
                <Skeleton height="4" width="44" rounded="sm" />
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <HStack key={i} justify="space-between" px="3" py="2">
                      <Skeleton height="4" width="24" rounded="sm" />
                      <Skeleton height="4" width="20" rounded="sm" />
                    </HStack>
                  ))}
                </SimpleGrid>
              </VStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </Grid>
    </VStack>
  )
}
