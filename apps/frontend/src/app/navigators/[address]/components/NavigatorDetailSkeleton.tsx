import { Card, Flex, HStack, SimpleGrid, Skeleton, VStack } from "@chakra-ui/react"

const DetailHeaderSkeleton = () => (
  <Card.Root variant="outline" borderRadius="xl">
    <Card.Body>
      <VStack gap={4} align="stretch">
        <HStack gap={4} align="center">
          <Skeleton boxSize={12} rounded="full" />
          <Skeleton height="7" width="40" rounded="md" />
          <HStack flex={1} justify="end">
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

const RoundVotesCardSkeleton = () => (
  <Card.Root w="full" variant="primary">
    <Card.Body>
      <Skeleton height={{ base: "3", md: "4" }} width="20" rounded="sm" mb={{ base: 2, md: 4 }} />
      <VStack gap={3} w="full" align="stretch">
        {[1, 2, 3].map(i => (
          <Card.Root key={i} variant="subtle" p={3}>
            <Card.Body flexDirection="row" justifyContent="space-between" alignItems="center" p={0}>
              <VStack align="start" gap={0.5}>
                <Skeleton height="4" width="24" rounded="md" />
                <Skeleton height="3" width="14" rounded="sm" />
              </VStack>
              <HStack gap={-1}>
                {[1, 2, 3].map(j => (
                  <Skeleton key={j} boxSize="7" rounded="full" ml="-1.5" />
                ))}
              </HStack>
            </Card.Body>
          </Card.Root>
        ))}
      </VStack>
    </Card.Body>
  </Card.Root>
)

const ProposalsCardSkeleton = () => (
  <Card.Root w="full" variant="primary" h="full">
    <Card.Body justifyContent="flex-start">
      <HStack w="full" justify="space-between" align="center" mb={{ base: 2, md: 4 }}>
        <HStack gap={2} align="center">
          <Skeleton height={{ base: "3", md: "4" }} width="24" rounded="sm" />
          <Skeleton height="5" width="6" rounded="sm" />
        </HStack>
      </HStack>
      <VStack w="full" gap={3}>
        {[1, 2, 3].map(i => (
          <Card.Root key={i} variant="subtle" p={3} w="full">
            <Card.Body p={0}>
              <VStack align="start" gap={1}>
                <Skeleton height="4" width="80%" rounded="md" />
                <Skeleton height="3" width="60%" rounded="sm" />
              </VStack>
            </Card.Body>
          </Card.Root>
        ))}
      </VStack>
    </Card.Body>
  </Card.Root>
)

const GovernanceActivitySkeleton = () => (
  <VStack gap={4} w="full">
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} w="full" alignItems="stretch">
      <RoundVotesCardSkeleton />
      <ProposalsCardSkeleton />
      <ProposalsCardSkeleton />
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

    {/* Activity */}
    <GovernanceActivitySkeleton />
  </VStack>
)
