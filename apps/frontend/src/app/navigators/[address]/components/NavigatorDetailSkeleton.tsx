import { Card, Flex, HStack, SimpleGrid, Skeleton, VStack } from "@chakra-ui/react"

const DetailHeaderSkeleton = () => (
  <Card.Root variant="outline" borderRadius="xl">
    <Card.Body>
      <VStack gap={4} align="stretch">
        <HStack gap={4} align="center" flexWrap="wrap">
          <Skeleton boxSize={12} rounded="full" flexShrink={0} />
          <Skeleton height="7" width={{ base: "32", md: "40" }} rounded="md" />
          <HStack flex={1} minW={0} justify="end">
            <Skeleton height="8" width="24" rounded="md" />
          </HStack>
        </HStack>
        <Skeleton height="4" width="80%" rounded="sm" />
        <Skeleton height="3" width="32" rounded="sm" />
      </VStack>
    </Card.Body>
  </Card.Root>
)

const DetailStatsSkeleton = () => (
  <SimpleGrid columns={{ base: 2, md: 4 }} gap={{ base: 2, md: 4 }} w="full">
    {[1, 2, 3, 4].map(i => (
      <Card.Root key={i} variant="outline" p={{ base: 2, md: 4 }}>
        <Card.Body flex={1}>
          <Flex direction="column" justify="space-between" h={{ base: "full", md: "auto" }} flex={1}>
            <Skeleton height={{ base: "3", md: "4" }} width="16" rounded="sm" mb={2} />
            <HStack gap={{ base: 2, md: 3 }}>
              <Skeleton w={{ base: "7", md: "10" }} h={{ base: "7", md: "10" }} rounded="full" flexShrink={0} />
              <Skeleton height={{ base: "5", md: "6" }} width="20" rounded="md" />
            </HStack>
          </Flex>
        </Card.Body>
      </Card.Root>
    ))}
  </SimpleGrid>
)

const RoundHistorySkeleton = () => (
  <VStack gap={3} w="full" align="stretch">
    <Skeleton height="6" width="24" rounded="md" />
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} w="full" alignItems="stretch">
      {[1, 2, 3].map(i => (
        <Card.Root key={i} w="full" variant="primary">
          <Card.Body>
            <VStack align="stretch" gap={3}>
              <Skeleton height="5" width="20" rounded="md" />
              <Skeleton height="3" width="60%" rounded="sm" />
              <Skeleton height="3" width="40%" rounded="sm" />
            </VStack>
          </Card.Body>
        </Card.Root>
      ))}
    </SimpleGrid>
  </VStack>
)

export const NavigatorDetailSkeleton = () => (
  <VStack w="full" gap={6} align="stretch" px={{ base: 4, md: 0 }}>
    {/* Breadcrumb */}
    <HStack gap={2}>
      <Skeleton height="4" width="20" rounded="sm" />
      <Skeleton height="4" width="4" rounded="sm" />
      <Skeleton height="4" width="16" rounded="sm" />
    </HStack>

    <DetailHeaderSkeleton />
    <DetailStatsSkeleton />
    <RoundHistorySkeleton />
  </VStack>
)
